// app/api/videos/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getVideoDetails } from '@/lib/youtube';

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // If no session, return unauthorized
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all distinct video chats for this user
    // Group by videoId to get the latest chat for each video
    const chats = await prisma.chat.findMany({
      where: {
        userId,
        // Only include chats that have a videoId (exclude general chats)
        videoId: {
          not: null,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      distinct: ['videoId'],
      select: {
        id: true,
        videoId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // For each chat, fetch the video details if not already in the title
    const enhancedChats = await Promise.all(
      chats.map(async (chat) => {
        // If the title is just a default "Chat about video...", try to get the real title
        if (
          chat.videoId &&
          (!chat.title || chat.title === `Chat about video ${chat.videoId}`)
        ) {
          try {
            const videoDetails = await getVideoDetails(chat.videoId);
            if (videoDetails) {
              return {
                ...chat,
                title: videoDetails.title,
                thumbnail: videoDetails.thumbnail,
                channelTitle: videoDetails.channelTitle,
              };
            }
          } catch (error) {
            console.error(
              `Error fetching details for video ${chat.videoId}:`,
              error
            );
            // Continue with the chat as-is if there's an error
          }
        }
        return chat;
      })
    );

    return NextResponse.json({ chats: enhancedChats });
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
