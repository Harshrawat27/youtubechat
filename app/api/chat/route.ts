import { NextResponse } from 'next/server';
import {
  getAccurateTranscript,
  processQuery,
  processGeneralQuery,
  generateSocialContent,
} from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { videoId, message, mode } = await request.json();

    // Handle general conversation if no videoId is provided
    if (!videoId && message) {
      const response = await processGeneralQuery(message);
      return NextResponse.json({ text: response, timestamps: [] });
    }

    if (!videoId || !message) {
      return NextResponse.json(
        { error: 'Video ID and message are required for video chat' },
        { status: 400 }
      );
    }

    try {
      // Handle social media content generation
      if (mode === 'social') {
        // First get transcript with Whisper
        const transcript = await getAccurateTranscript(videoId);

        const contentType = message.toLowerCase().includes('thread')
          ? 'thread'
          : message.toLowerCase().includes('twitter') ||
            message.toLowerCase().includes('post')
          ? 'twitter'
          : 'summary';

        // Generate social content
        const content = await generateSocialContent(contentType, transcript);
        return NextResponse.json({ text: content, timestamps: [] });
      }

      // Get accurate transcript using Whisper
      const transcript = await getAccurateTranscript(videoId);

      if (!transcript || transcript.length === 0) {
        return NextResponse.json({
          text: "I couldn't transcribe this video. This might be due to the video length or format. Please try a different video.",
          timestamps: [],
        });
      }

      // Process query using OpenAI
      const result = await processQuery(message, transcript);

      return NextResponse.json(result);
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
