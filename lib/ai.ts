import OpenAI from 'openai';
import { getRelevantContext } from './context-processor';

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

/**
 * Process a user query about the video using OpenAI
 */
export async function processQuery(
  query: string,
  transcript: any[]
): Promise<ProcessQueryResult> {
  try {
    // Get the most relevant context for the query
    const relevantSegments = getRelevantContext(query, transcript);
    console.log(
      `Using ${relevantSegments.length} segments out of ${transcript.length} total segments`
    );

    // Format transcript for AI with precise timestamps
    const formattedTranscript = relevantSegments
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
I'm only providing the most relevant parts of the transcript for this question.

TRANSCRIPT EXCERPTS:
${formattedTranscript}

USER QUESTION: "${query}"

Please answer the question based on the transcript content. If the question is about a specific topic or segment, include relevant timestamps in your response.

Your response should be in the following JSON format:
{
  "answer": "Your detailed answer here. If the information isn't in the provided transcript excerpts, acknowledge that you only have partial transcript and may not have all the information.",
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using a more capable model
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that answers questions about YouTube video content based on transcript excerpts with precise timestamps.',
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
      text: 'I encountered an error processing your question. This may be due to the video length. Try asking a more specific question about a particular part of the video.',
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
  try {
    // For social content, we'll sample the transcript to avoid token limits
    const sampledTranscript = sampleTranscript(transcript);

    // Format transcript for AI
    const formattedTranscript = sampledTranscript
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            "You're an expert at creating engaging social media content from video transcripts. Note that you may only have a portion of the full transcript, so focus on creating engaging content from what's available.",
        },
        {
          role: 'user',
          content: `Here's a transcript from a YouTube video (note that this might be partial for longer videos):\n\n${formattedTranscript}\n\n${prompts[contentType]}`,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Could not generate content.';
  } catch (error) {
    console.error('Error generating social content:', error);
    return 'Error generating content. Please try again. For very long videos, try specifying which part of the video to summarize.';
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

/**
 * Sample the transcript to get representative parts within token limits
 */
function sampleTranscript(transcript: any[], sampleRatio = 0.2): any[] {
  if (transcript.length < 50) {
    return transcript; // Return the full transcript for short videos
  }

  // For long videos, take beginning, some middle parts, and the end
  const beginning = transcript.slice(0, Math.floor(transcript.length * 0.1));
  const end = transcript.slice(Math.floor(transcript.length * 0.9));

  // Sample the middle parts
  const middleStart = Math.floor(transcript.length * 0.1);
  const middleEnd = Math.floor(transcript.length * 0.9);
  const middleParts = transcript.slice(middleStart, middleEnd);

  const samplingStep = Math.floor(1 / sampleRatio);
  const sampledMiddle = middleParts.filter((_, i) => i % samplingStep === 0);

  return [...beginning, ...sampledMiddle, ...end];
}

// Helper function to format timestamp
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}
