import GPT3Tokenizer from 'gpt-tokenizer';

// Maximum tokens for context (leaving room for prompt and completion)
const MAX_CONTEXT_TOKENS = 15000;

// Interface for transcript segment
interface TranscriptSegment {
  text: string;
  start: number; // seconds
  end: number; // seconds
}

/**
 * Processes a transcript to extract the most relevant segments for a query
 * @param query The user's question
 * @param transcript The full transcript segments
 * @returns Filtered transcript segments that fit within token limits
 */
export function getRelevantContext(
  query: string,
  transcript: TranscriptSegment[]
): TranscriptSegment[] {
  // If transcript is small enough, return it all
  const fullTranscriptText = transcript
    .map((segment) => segment.text)
    .join(' ');
  const tokenCount = GPT3Tokenizer.encode(fullTranscriptText).length;

  if (tokenCount <= MAX_CONTEXT_TOKENS) {
    return transcript;
  }

  // If transcript is too large, we need to filter it
  return filterByRelevance(query, transcript);
}

/**
 * Filter transcript by relevance to query using keyword matching and chunking
 */
function filterByRelevance(
  query: string,
  transcript: TranscriptSegment[]
): TranscriptSegment[] {
  // Extract keywords from query (simple approach)
  const keywords = extractKeywords(query);

  // Score each segment based on keyword matches
  const scoredSegments = transcript.map((segment) => {
    const score = scoreSegmentByKeywords(segment, keywords);
    return { ...segment, score };
  });

  // Sort by score descending
  scoredSegments.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Take top segments until we hit token limit
  const selectedSegments: TranscriptSegment[] = [];
  let totalTokens = 0;

  for (const segment of scoredSegments) {
    const segmentTokens = GPT3Tokenizer.encode(segment.text).length;

    if (totalTokens + segmentTokens <= MAX_CONTEXT_TOKENS) {
      selectedSegments.push(segment);
      totalTokens += segmentTokens;
    } else if (totalTokens < MAX_CONTEXT_TOKENS * 0.9) {
      // If we're not close to limit yet, try to include partial text
      const remainingTokens = MAX_CONTEXT_TOKENS - totalTokens;
      const partialText = truncateText(segment.text, remainingTokens);

      if (partialText) {
        selectedSegments.push({
          ...segment,
          text: partialText,
        });
      }

      break;
    } else {
      // We're close enough to the limit
      break;
    }
  }

  // Re-sort by chronological order to maintain timeline
  return selectedSegments.sort((a, b) => a.start - b.start);
}

/**
 * Simple keyword extraction from query
 */
function extractKeywords(query: string): string[] {
  // Remove common stop words and convert to lowercase
  const stopWords = new Set([
    'a',
    'an',
    'the',
    'and',
    'or',
    'but',
    'is',
    'are',
    'was',
    'were',
    'in',
    'on',
    'at',
    'to',
    'for',
    'with',
    'about',
    'of',
    'by',
    'how',
    'what',
    'when',
    'where',
    'why',
    'who',
    'which',
    'do',
    'does',
    'did',
    'have',
    'has',
    'had',
    'am',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'this',
    'that',
    'these',
    'those',
    'there',
    'their',
    'they',
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter((word) => !stopWords.has(word) && word.length > 2); // Filter stop words and short words
}

/**
 * Score segment based on keyword matches
 */
function scoreSegmentByKeywords(
  segment: TranscriptSegment,
  keywords: string[]
): number {
  const text = segment.text.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    // Count occurrences of keyword in text
    const regex = new RegExp(`\\b${keyword}\\b`, 'ig');
    const matches = text.match(regex);

    if (matches) {
      score += matches.length;
    }
  }

  return score;
}

/**
 * Truncate text to fit within token limit
 */
function truncateText(text: string, tokenLimit: number): string {
  const words = text.split(/\s+/);
  let result = '';
  let currentTokens = 0;

  for (const word of words) {
    const wordWithSpace = result ? ' ' + word : word;
    const wordTokens = GPT3Tokenizer.encode(wordWithSpace).length;

    if (currentTokens + wordTokens <= tokenLimit) {
      result += wordWithSpace;
      currentTokens += wordTokens;
    } else {
      break;
    }
  }

  return result;
}
