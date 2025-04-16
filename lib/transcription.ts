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
const TEMP_DIR = path.join(process.cwd(), 'tmp');

// Ensure directories exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Whisper API chunk size limit (slightly below the 25MB limit)
const MAX_CHUNK_SIZE_BYTES = 24 * 1024 * 1024; // 24MB

// Max chunk duration in seconds
const MAX_CHUNK_DURATION = 600; // 10 minutes per chunk

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

// Transcript segment with start and end times
interface TranscriptSegment {
  text: string;
  start: number; // seconds
  end: number; // seconds
}

// Map to track ongoing transcriptions
const ongoingTranscriptions = new Map<string, Promise<any>>();
// Map to track transcription progress (0-100)
const transcriptionProgress = new Map<string, number>();

/**
 * Get or create transcript for a video
 * @param videoId YouTube video ID
 * @returns Promise resolving to transcript segments
 */
export async function getTranscript(
  videoId: string
): Promise<TranscriptSegment[]> {
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
    return ongoingTranscriptions.get(videoId)!;
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
 * Get the current progress of a transcription (0-100)
 * @param videoId YouTube video ID
 * @returns number between 0-100 representing progress, or null if not in progress
 */
export function getTranscriptionProgress(videoId: string): number | null {
  if (!isTranscriptionInProgress(videoId)) {
    return null;
  }
  return transcriptionProgress.get(videoId) || 0;
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
async function createTranscript(videoId: string): Promise<TranscriptSegment[]> {
  // Define file paths
  const videoPath = path.join(TEMP_DIR, `${videoId}.mp4`);
  const audioPath = path.join(TEMP_DIR, `${videoId}.mp3`);

  try {
    // Initialize progress
    transcriptionProgress.set(videoId, 0);

    // Download video using yt-dlp
    console.log(`Downloading video ${videoId}...`);
    await downloadVideo(videoId, videoPath);
    transcriptionProgress.set(videoId, 15);

    // Extract audio from video
    console.log(`Extracting audio from ${videoId}...`);
    await extractAudio(videoPath, audioPath);
    transcriptionProgress.set(videoId, 30);

    // Get audio duration
    const duration = await getAudioDuration(audioPath);
    console.log(`Audio duration: ${duration} seconds`);

    // Split audio into chunks if needed
    const chunkPaths = await splitAudioIntoChunks(audioPath, duration);
    console.log(`Split audio into ${chunkPaths.length} chunks`);

    // Process each chunk with progress updates
    const totalChunks = chunkPaths.length;
    const progressPerChunk = 60 / totalChunks; // 60% of progress for transcription
    let allSegments: TranscriptSegment[] = [];

    // Track last processed index for proper timestamps
    let lastProcessedTime = 0;

    for (let i = 0; i < chunkPaths.length; i++) {
      const chunkPath = chunkPaths[i];
      console.log(
        `Transcribing chunk ${i + 1}/${chunkPaths.length}: ${chunkPath}`
      );

      // Transcribe chunk
      const chunkSegments = await transcribeAudio(chunkPath);

      // Calculate offset based on chunk position
      const timeOffset = i * MAX_CHUNK_DURATION;

      // Adjust segment times and add to the full list
      const adjustedSegments = chunkSegments.map((segment) => ({
        text: segment.text,
        start: segment.start + timeOffset,
        end: segment.end + timeOffset,
      }));

      allSegments = [...allSegments, ...adjustedSegments];

      // Update progress
      transcriptionProgress.set(videoId, 30 + (i + 1) * progressPerChunk);

      // Track the last processed time
      lastProcessedTime = timeOffset + MAX_CHUNK_DURATION;
    }

    // Clean up temp files
    console.log('Cleaning up temp files...');
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      // Remove chunk files
      for (const chunkPath of chunkPaths) {
        if (fs.existsSync(chunkPath)) fs.unlinkSync(chunkPath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }

    transcriptionProgress.set(videoId, 100);
    console.log('Transcription completed!');
    return allSegments;
  } catch (error) {
    console.error('Error in transcript processing:', error);
    // Clean up any files that might have been created
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      // Remove any chunk files
      const chunkDir = path.dirname(audioPath);
      const files = fs.readdirSync(chunkDir);
      for (const file of files) {
        if (file.startsWith(`${videoId}_chunk_`)) {
          fs.unlinkSync(path.join(chunkDir, file));
        }
      }
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
      // Add bitrate limitation to reduce file size for long videos
      '-b:a',
      '64k', // Lower bitrate to reduce file size
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
 * Get audio duration using ffprobe
 */
async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ]);

    let output = '';
    let errorOutput = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${errorOutput}`));
      } else {
        // Parse the duration
        const duration = parseFloat(output.trim());
        resolve(duration);
      }
    });
  });
}

/**
 * Split audio into manageable chunks for Whisper API
 * @returns Array of paths to the chunk files
 */
async function splitAudioIntoChunks(
  audioPath: string,
  duration: number
): Promise<string[]> {
  const baseDir = path.dirname(audioPath);
  const baseName = path.basename(audioPath, '.mp3');
  const chunkPaths: string[] = [];

  // Calculate number of chunks needed
  const numChunks = Math.ceil(duration / MAX_CHUNK_DURATION);

  // If just one chunk is needed, use the original file
  if (numChunks <= 1) {
    const stat = fs.statSync(audioPath);
    if (stat.size <= MAX_CHUNK_SIZE_BYTES) {
      return [audioPath];
    }
  }

  // Split into chunks of MAX_CHUNK_DURATION
  for (let i = 0; i < numChunks; i++) {
    const startTime = i * MAX_CHUNK_DURATION;
    const chunkPath = path.join(baseDir, `${baseName}_chunk_${i}.mp3`);
    chunkPaths.push(chunkPath);

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i',
        audioPath,
        '-ss',
        startTime.toString(),
        '-t',
        MAX_CHUNK_DURATION.toString(),
        '-q:a',
        '0',
        // Add stronger compression for chunks to ensure they're under the limit
        '-b:a',
        '48k', // Lower bitrate for chunks
        '-ac',
        '1', // Convert to mono
        chunkPath,
      ]);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `ffmpeg chunk split exited with code ${code}: ${errorOutput}`
            )
          );
        } else {
          // Verify size is under limit
          const stat = fs.statSync(chunkPath);
          if (stat.size > MAX_CHUNK_SIZE_BYTES) {
            console.warn(
              `Chunk size (${stat.size} bytes) exceeds limit. Compressing more.`
            );
            // If it's too big, we'll need to compress more or adjust the chunk duration
            // This could be handled in a recursive way, but for simplicity we'll just fail
            reject(
              new Error(
                `Chunk size (${stat.size} bytes) exceeds limit of ${MAX_CHUNK_SIZE_BYTES} bytes.`
              )
            );
          } else {
            resolve();
          }
        }
      });
    });
  }

  return chunkPaths;
}

/**
 * Transcribe audio file with OpenAI Whisper API
 */
async function transcribeAudio(
  audioPath: string
): Promise<TranscriptSegment[]> {
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
