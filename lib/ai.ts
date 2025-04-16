import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Timestamp {
  seconds: number;
  label?: string;
}

interface ProcessQueryResult {
  text: string;
  timestamps: Timestamp[];
}

// Interface for Whisper API response
interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface WhisperResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
}

/**
 * Download YouTube video audio and transcribe with Whisper for precise timestamps
 */
export async function getAccurateTranscript(videoId: string): Promise<any> {
  // Define file paths
  const tempDir = path.join(process.cwd(), 'tmp');
  const videoPath = path.join(tempDir, `${videoId}.mp4`);
  const audioPath = path.join(tempDir, `${videoId}.mp3`);

  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Download video using yt-dlp (more reliable than ytdl-core)
    await downloadVideo(videoId, videoPath);

    // Extract audio from video
    await extractAudio(videoPath, audioPath);

    // Transcribe with Whisper
    const segments = await transcribeAudio(audioPath);

    // Clean up temp files
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }

    return segments;
  } catch (error) {
    console.error('Error in transcript processing:', error);
    // Clean up any files that might have been created
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    } catch (cleanupError) {
      console.error('Error cleaning up after failure:', cleanupError);
    }
    throw error;
  }
}

/**
 * Download YouTube video using Python's yt-dlp (must be installed on server)
 */
async function downloadVideo(
  videoId: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ytDlp = spawn('yt-dlp', [
      `https://www.youtube.com/watch?v=${videoId}`,
      '-f',
      'bestaudio[ext=m4a]/bestaudio',
      '-o',
      outputPath,
    ]);

    let errorOutput = '';

    ytDlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytDlp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}: ${errorOutput}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Extract audio from video using ffmpeg (must be installed on server)
 */
async function extractAudio(
  videoPath: string,
  audioPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i',
      videoPath,
      '-q:a',
      '0',
      '-map',
      'a',
      '-f',
      'mp3',
      audioPath,
    ]);

    let errorOutput = '';

    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}: ${errorOutput}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Transcribe audio file with OpenAI Whisper API
 */
async function transcribeAudio(audioPath: string): Promise<any[]> {
  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(audioPath)]), 'audio.mp3');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch(
    'https://api.openai.com/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whisper API error: ${response.status} ${errorText}`);
  }

  const result = (await response.json()) as WhisperResponse;

  // Process segments with precise timestamps
  const segments =
    result.segments?.map((segment: WhisperSegment) => ({
      text: segment.text,
      start: segment.start || 0,
      end: segment.end || 0,
    })) || [];

  return segments;
}

/**
 * Process a user query about the video using OpenAI
 */
export async function processQuery(
  query: string,
  transcript: any[]
): Promise<ProcessQueryResult> {
  // Format transcript for AI with precise timestamps
  const formattedTranscript = transcript
    .map(
      (segment) =>
        `[${formatTimestamp(segment.start)} - ${formatTimestamp(
          segment.end
        )}] ${segment.text}`
    )
    .join('\n');

  // Build the prompt
  const prompt = `
I have a YouTube video transcript with precise timestamps and need to answer a question about it.

TRANSCRIPT:
${formattedTranscript}

USER QUESTION: "${query}"

Please answer the question based on the transcript content. If the question is about a specific topic or segment, include relevant timestamps in your response.

Your response should be in the following JSON format:
{
  "answer": "Your detailed answer here",
  "timestamps": [
    {
      "time": "MM:SS", 
      "seconds": 123, 
      "description": "Brief description of this segment"
    }
  ]
}

Only include timestamps if they are directly relevant to the question. If no specific timestamps are relevant, return an empty array for timestamps.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using a more capable model
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that answers questions about YouTube video content based on transcripts with precise timestamps.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Empty response from AI');
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(responseContent);

    // Format timestamps
    const formattedTimestamps: Timestamp[] = (
      parsedResponse.timestamps || []
    ).map((ts: any) => ({
      seconds: ts.seconds,
      label: ts.description,
    }));

    return {
      text: parsedResponse.answer,
      timestamps: formattedTimestamps,
    };
  } catch (error) {
    console.error('Error processing query with AI:', error);
    return {
      text: 'I encountered an error processing your question. Please try again.',
      timestamps: [],
    };
  }
}

/**
 * Generate social media content based on video content
 */
export async function generateSocialContent(
  contentType: 'twitter' | 'thread' | 'summary',
  transcript: any[]
): Promise<string> {
  // Format transcript from Whisper for AI
  const formattedTranscript = transcript
    .map((segment) => segment.text)
    .join(' ');

  // Content type specific prompts
  const prompts = {
    twitter:
      'Create a concise, engaging Twitter post (max 280 characters) summarizing the key points of this video.',
    thread:
      'Create a Twitter thread (5-7 tweets) breaking down the main insights from this video. Format as Tweet 1: [content], Tweet 2: [content], etc.',
    summary:
      'Create a comprehensive summary of this video highlighting the key points, insights, and conclusions.',
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            "You're an expert at creating engaging social media content from video transcripts.",
        },
        {
          role: 'user',
          content: `Here's a transcript from a YouTube video transcribed with Whisper:\n\n${formattedTranscript}\n\n${prompts[contentType]}`,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Could not generate content.';
  } catch (error) {
    console.error('Error generating social content:', error);
    return 'Error generating content. Please try again.';
  }
}

/**
 * Process general conversation (not video specific)
 */
export async function processGeneralQuery(query: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that can answer general questions and provide information.',
        },
        { role: 'user', content: query },
      ],
      temperature: 0.7,
    });

    return (
      response.choices[0].message.content || "I couldn't process your request."
    );
  } catch (error) {
    console.error('Error in general conversation:', error);
    return 'I encountered an error. Please try again.';
  }
}

// Helper function to format timestamp
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}
