// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import {
  processQuery,
  processGeneralQuery,
  generateSocialContent,
} from '@/lib/ai';
import { getTranscript } from '@/lib/transcription';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Get current session to identify the user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const { videoId, message, mode, chatId } = await request.json();

    // Handle general conversation if no videoId is provided
    if (!videoId && message) {
      const response = await processGeneralQuery(message);

      // For general chat, we still save the messages but without a videoId
      let chat;
      if (chatId) {
        chat = await prisma.chat.findUnique({
          where: { id: chatId },
        });
      } else {
        chat = await prisma.chat.create({
          data: {
            title: 'General Chat',
            userId,
          },
        });
      }

      // Save user message
      await prisma.message.create({
        data: {
          content: message,
          type: 'user',
          chatId: chat.id,
        },
      });

      // Save assistant response
      await prisma.message.create({
        data: {
          content: response,
          type: 'assistant',
          chatId: chat.id,
        },
      });

      return NextResponse.json({
        text: response,
        timestamps: [],
        chatId: chat.id,
      });
    }

    if (!videoId || !message) {
      return NextResponse.json(
        { error: 'Video ID and message are required for video chat' },
        { status: 400 }
      );
    }

    try {
      // Use the cached transcript or get it if it's already been transcribed
      const transcript = await getTranscript(videoId);

      if (!transcript || transcript.length === 0) {
        return NextResponse.json({
          text: "I couldn't transcribe this video. This might be due to the video length or format. Please try a different video.",
          timestamps: [],
        });
      }

      // Get or create chat for this video
      let chat;
      if (chatId) {
        chat = await prisma.chat.findUnique({
          where: { id: chatId },
        });
      } else {
        chat = await prisma.chat.create({
          data: {
            videoId,
            title: `Chat about video ${videoId}`,
            userId,
          },
        });
      }

      // Save user message
      await prisma.message.create({
        data: {
          content: message,
          type: 'user',
          chatId: chat.id,
        },
      });

      let result;
      // Handle social media content generation
      if (mode === 'social') {
        const contentType = message.toLowerCase().includes('thread')
          ? 'thread'
          : message.toLowerCase().includes('twitter') ||
            message.toLowerCase().includes('post')
          ? 'twitter'
          : 'summary';

        // Generate social content
        const content = await generateSocialContent(contentType, transcript);
        result = { text: content, timestamps: [] };
      } else {
        // Process query using the transcript and OpenAI
        result = await processQuery(message, transcript);
      }

      // Save assistant response with timestamps if any
      await prisma.message.create({
        data: {
          content: result.text,
          type: 'assistant',
          chatId: chat.id,
          timestamps:
            result.timestamps.length > 0 ? result.timestamps : undefined,
        },
      });

      return NextResponse.json({
        ...result,
        chatId: chat.id,
      });
    } catch (transcriptError) {
      console.error('Error processing transcript:', transcriptError);

      return NextResponse.json({
        text: 'I had trouble processing this video. This could be due to download restrictions or transcription limits. Please try a shorter video or check if the video is publicly available.',
        timestamps: [],
      });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {
        text: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamps: [],
      },
      { status: 500 }
    );
  }
}

// New endpoint to get previous messages for a chat
export async function GET(request: Request) {
  try {
    // Get current session to identify the user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const chatId = searchParams.get('chatId');

    if (!videoId && !chatId) {
      return NextResponse.json(
        { error: 'Either videoId or chatId must be provided' },
        { status: 400 }
      );
    }

    let chat;
    if (chatId) {
      // Get specific chat by ID
      chat = await prisma.chat.findUnique({
        where: {
          id: chatId,
          userId, // Ensure the chat belongs to the requesting user
        },
        include: {
          messages: {
            orderBy: {
              timestamp: 'asc',
            },
          },
        },
      });
    } else {
      // Find most recent chat for this video
      chat = await prisma.chat.findFirst({
        where: {
          videoId,
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          messages: {
            orderBy: {
              timestamp: 'asc',
            },
          },
        },
      });
    }

    if (!chat) {
      return NextResponse.json({ messages: [], chatId: null });
    }

    return NextResponse.json({
      messages: chat.messages,
      chatId: chat.id,
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}
