import { NextResponse } from 'next/server';
import { getVideoDetails } from '@/lib/youtube';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { success: false, message: 'Video ID is required' },
      { status: 400 }
    );
  }

  try {
    const videoDetails = await getVideoDetails(videoId);

    if (!videoDetails) {
      return NextResponse.json(
        { success: false, message: 'Video not found or not accessible' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, videoDetails });
  } catch (error) {
    console.error('Error checking video:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check video' },
      { status: 500 }
    );
  }
}
