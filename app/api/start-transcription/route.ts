import { NextResponse } from 'next/server';
import {
  getTranscript,
  isTranscriptCached,
  isTranscriptionInProgress,
} from '@/lib/transcription';

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check if transcript already exists or is being processed
    if (isTranscriptCached(videoId)) {
      return NextResponse.json({ status: 'completed', videoId });
    }

    if (isTranscriptionInProgress(videoId)) {
      return NextResponse.json({ status: 'in_progress', videoId });
    }

    // Start transcription process in the background
    getTranscript(videoId).catch((error) => {
      console.error(`Error transcribing video ${videoId}:`, error);
    });

    return NextResponse.json({ status: 'started', videoId });
  } catch (error) {
    console.error('Error starting transcription:', error);
    return NextResponse.json(
      { error: 'Failed to start transcription' },
      { status: 500 }
    );
  }
}
