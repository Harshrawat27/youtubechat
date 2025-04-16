import { Message, MessageType } from '@/lib/types';
import { formatTimestamp, formatTime } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Clock, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  message: Message;
  onTimestampClick: (seconds: number) => void;
  onCopy?: () => void;
}

export default function ChatMessage({
  message,
  onTimestampClick,
  onCopy,
}: ChatMessageProps) {
  const isUser = message.type === MessageType.USER;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderTimestamps = () => {
    if (!message.timestamps || message.timestamps.length === 0) return null;

    return (
      <div className='mt-3 space-y-2'>
        <p className='text-sm text-gray-300 font-medium'>
          Relevant timestamps:
        </p>
        <div className='flex flex-wrap gap-2'>
          {message.timestamps.map((timestamp, index) => (
            <button
              key={index}
              onClick={() => onTimestampClick(timestamp.seconds)}
              className='flex items-center gap-1 bg-dark-300 hover:bg-dark-200 text-primary-300 px-3 py-1 rounded-full text-sm border border-primary-500/30 transition-colors'
            >
              <Clock size={14} />
              <span>{formatTimestamp(timestamp.seconds)}</span>
              {timestamp.label && <span>- {timestamp.label}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className='bg-primary-500 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0'>
          <Bot size={18} />
        </div>
      )}
      <div
        className={`max-w-[80%] ${
          isUser ? 'bg-primary-500/20 text-white' : 'bg-dark-300 text-gray-100'
        } p-4 rounded-lg`}
      >
        <div className='prose prose-invert prose-sm max-w-none'>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {renderTimestamps()}

        <div className='flex items-center justify-between text-xs text-gray-400 mt-2'>
          <span>{formatTime(message.timestamp)}</span>

          {onCopy && (
            <button
              onClick={handleCopy}
              className='flex items-center gap-1 hover:text-primary-300 transition-colors'
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {isUser && (
        <div className='bg-dark-300 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0'>
          <User size={18} />
        </div>
      )}
    </div>
  );
}
