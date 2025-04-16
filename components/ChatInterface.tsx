'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, MessageType } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { Send, Twitter, Copy, FileText } from 'lucide-react';
import ChatMessage from './ChatMessage';

interface ChatInterfaceProps {
  videoId?: string;
}

export default function ChatInterface({ videoId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: videoId
        ? 'I\'m your AI assistant for this video. Ask me questions about the content, like "Where do they talk about X?" or "Summarize the part about Y."'
        : 'How can I help you today? You can ask me general questions or request me to create social media content.',
      type: MessageType.ASSISTANT,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialMode, setSocialMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      type: MessageType.USER,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          message: inputValue,
          // Social mode for content creation requests
          mode: socialMode ? 'social' : 'normal',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString() + '-response',
        content: data.text,
        type: MessageType.ASSISTANT,
        timestamp: new Date(),
        timestamps: data.timestamps || [],
        // Add flag for social content to enable copy button
        isSocialContent: socialMode,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Reset social mode after response
      if (socialMode) {
        setSocialMode(false);
      }
    } catch (error) {
      console.error('Error getting chat response:', error);

      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        content: "Sorry, I couldn't process your request. Please try again.",
        type: MessageType.ASSISTANT,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Detect social media content requests
  useEffect(() => {
    const socialKeywords = [
      'twitter post',
      'create a thread',
      'twitter thread',
      'social media post',
    ];
    const isSocialRequest = socialKeywords.some((keyword) =>
      inputValue.toLowerCase().includes(keyword)
    );

    setSocialMode(isSocialRequest);
  }, [inputValue]);

  return (
    <div className='flex flex-col h-screen'>
      <div className='p-4 bg-dark-400 border-b border-dark-300'>
        <h2 className='text-xl font-semibold'>
          {videoId ? 'Video Chat' : 'Chat Assistant'}
        </h2>
        {socialMode && (
          <div className='mt-2 flex items-center gap-2 text-primary-300 text-sm'>
            <Twitter size={14} />
            <span>Social content creation mode</span>
          </div>
        )}
      </div>

      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onTimestampClick={(seconds) => {
              if (
                typeof window !== 'undefined' &&
                (window as any).seekToVideoTime
              ) {
                (window as any).seekToVideoTime(seconds);
              }
            }}
            onCopy={
              message.isSocialContent
                ? () => copyToClipboard(message.content)
                : undefined
            }
          />
        ))}
        {isLoading && (
          <div className='flex items-center gap-2 text-gray-400 my-4'>
            <div className='flex space-x-1'>
              <div
                className='w-2 h-2 bg-primary-400 rounded-full animate-bounce'
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className='w-2 h-2 bg-primary-400 rounded-full animate-bounce'
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className='w-2 h-2 bg-primary-400 rounded-full animate-bounce'
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className='p-4 border-t border-dark-300 bg-dark-400'>
        <form onSubmit={handleSubmit} className='flex items-center gap-2'>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              videoId
                ? 'Ask about the video content...'
                : 'Ask a question or request social media content...'
            }
            className='input-primary flex-grow py-3'
            disabled={isLoading}
          />
          <button
            type='submit'
            className='btn-primary p-3 rounded-full'
            disabled={isLoading || !inputValue.trim()}
          >
            <Send size={20} />
          </button>
        </form>

        {videoId && (
          <div className='mt-3 flex gap-2'>
            <button
              className='text-xs text-primary-300 hover:text-primary-200 flex items-center gap-1'
              onClick={() =>
                setInputValue('Create a Twitter post summarizing this video')
              }
            >
              <Twitter size={12} />
              <span>Twitter Post</span>
            </button>
            <button
              className='text-xs text-primary-300 hover:text-primary-200 flex items-center gap-1'
              onClick={() =>
                setInputValue(
                  'Create a Twitter thread breaking down this video'
                )
              }
            >
              <FileText size={12} />
              <span>Twitter Thread</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
