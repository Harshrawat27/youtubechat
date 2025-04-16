import axios from 'axios';
import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Extract video ID from a YouTube URL
 */
export function extractVideoId(url: string): string | null {
  // Handle both standard and short YouTube URLs
  const regexPatterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /(?:youtube\.com\/shorts\/)([^"&?\/\s]{11})/i,
  ];

  for (const regex of regexPatterns) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get video details from YouTube
 */
export async function getVideoDetails(videoId: string) {
  try {
    // In a production app, you would use the YouTube Data API
    // For this example, we'll use a simple approach
    const response = await axios.get(
      `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`
    );

    return {
      title: response.data.title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: response.data.author_name,
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}

/**
 * Get video transcript from YouTube
 */
export async function getVideoTranscript(videoId: string) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return null;
  }
}

/**
 * Format transcript data for AI processing
 */
export function formatTranscriptForAI(transcript: any[]) {
  if (!transcript || transcript.length === 0) {
    return '';
  }

  return transcript
    .map((segment) => {
      const timestamp = Math.floor(segment.offset / 1000);
      return `[${formatTimestamp(timestamp)}] ${segment.text}`;
    })
    .join('\n');
}

/**
 * Format timestamp as MM:SS
 */
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}
