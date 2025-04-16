export enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface Timestamp {
  seconds: number;
  label?: string;
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  timestamps?: Timestamp[];
  isSocialContent?: boolean;
}

export interface VideoTranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface VideoDetails {
  title: string;
  thumbnail: string;
  channelTitle: string;
}
