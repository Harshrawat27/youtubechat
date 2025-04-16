import { NextResponse } from 'next/server';
import {
  isTranscriptionInProgress,
  isTranscriptCached,
} from '@/lib/transcription';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    );
  }

  const inProgress = isTranscriptionInProgress(videoId);
  const isCached = isTranscriptCached(videoId);

  return NextResponse.json({
    videoId,
    status: isCached ? 'completed' : inProgress ? 'in_progress' : 'not_started',
  });
}
