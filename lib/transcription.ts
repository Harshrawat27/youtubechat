import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Directory for caching transcripts
const CACHE_DIR = path.join(process.cwd(), 'cache');

// Interface for Whisper API response segment
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

// Map to track ongoing transcriptions
const ongoingTranscriptions = new Map<string, Promise<any>>();

// Make sure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Get or create transcript for a video
 * @param videoId YouTube video ID
 * @returns Promise resolving to transcript segments
 */
export async function getTranscript(videoId: string): Promise<any> {
  const cacheFilePath = path.join(CACHE_DIR, `${videoId}.json`);

  // Check if cached transcript exists
  if (fs.existsSync(cacheFilePath)) {
    console.log(`Using cached transcript for ${videoId}`);
    const cachedTranscript = JSON.parse(
      fs.readFileSync(cacheFilePath, 'utf-8')
    );
    return cachedTranscript;
  }

  // Check if transcription is already in progress
  if (ongoingTranscriptions.has(videoId)) {
    console.log(`Transcription for ${videoId} already in progress, waiting...`);
    return ongoingTranscriptions.get(videoId);
  }

  // Start new transcription process
  console.log(`Starting new transcription for ${videoId}`);
  const transcriptionPromise = createTranscript(videoId);

  // Store the promise to prevent duplicate transcriptions
  ongoingTranscriptions.set(videoId, transcriptionPromise);

  try {
    // Await the result
    const result = await transcriptionPromise;

    // Cache the result
    fs.writeFileSync(cacheFilePath, JSON.stringify(result));

    // Remove from ongoing transcriptions map
    ongoingTranscriptions.delete(videoId);

    return result;
  } catch (error) {
    // Remove from ongoing transcriptions map on error
    ongoingTranscriptions.delete(videoId);
    throw error;
  }
}

/**
 * Check if transcription is in progress
 * @param videoId YouTube video ID
 * @returns boolean indicating if transcription is in progress
 */
export function isTranscriptionInProgress(videoId: string): boolean {
  return ongoingTranscriptions.has(videoId);
}

/**
 * Check if transcript is already cached
 * @param videoId YouTube video ID
 * @returns boolean indicating if transcript is cached
 */
export function isTranscriptCached(videoId: string): boolean {
  const cacheFilePath = path.join(CACHE_DIR, `${videoId}.json`);
  return fs.existsSync(cacheFilePath);
}

/**
 * Create transcript from YouTube video audio
 * @param videoId YouTube video ID
 * @returns Promise resolving to transcript segments
 */
async function createTranscript(videoId: string): Promise<any> {
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
 * Download YouTube video using yt-dlp
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
 * Extract audio from video using ffmpeg
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
