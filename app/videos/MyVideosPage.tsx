'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageSquare,
  Clock,
  CalendarDays,
  Search,
  Video,
  ArrowRight,
} from 'lucide-react';
import { FadeLoader } from '@/components/ui/Loader';

interface VideoChat {
  id: string;
  videoId: string;
  title: string;
  thumbnail?: string;
  channelTitle?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

export default function MyVideosPage() {
  const { status, isSubscriptionActive } = useAuth();
  const [videoChats, setVideoChats] = useState<VideoChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch videos if user is authenticated and subscription is active
    if (status === 'authenticated' && isSubscriptionActive) {
      fetchVideos();
    } else {
      setLoading(false);
    }
  }, [status, isSubscriptionActive]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos');

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      setVideoChats(data.chats || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load your videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter videos based on search term
  const filteredVideos = videoChats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.channelTitle &&
        chat.channelTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin} min ago`;
      if (diffHour < 24) return `${diffHour} hr ago`;
      if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown date';
    }
  };

  if (status === 'loading') {
    return (
      <>
        <Header />
        <div className='flex items-center justify-center min-h-screen'>
          <FadeLoader color='#8975EA' />
        </div>
      </>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <Header />
        <div className='flex items-center justify-center min-h-screen p-4'>
          <div className='bg-dark-300 p-6 rounded-lg border border-primary-500/20 max-w-md text-center'>
            <h2 className='text-xl font-bold mb-4 text-white'>
              Sign In Required
            </h2>
            <p className='text-gray-300 mb-4'>
              Please sign in to view your video history.
            </p>
            <Link
              href='/auth/signin?callbackUrl=/videos'
              className='btn-primary inline-block'
            >
              Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!isSubscriptionActive) {
    return (
      <>
        <Header />
        <div className='flex items-center justify-center min-h-screen p-4'>
          <div className='bg-dark-300 p-6 rounded-lg border border-primary-500/20 max-w-md text-center'>
            <h2 className='text-xl font-bold mb-4 text-white'>
              Subscription Inactive
            </h2>
            <p className='text-gray-300 mb-4'>
              Your subscription is currently inactive. Please renew your
              subscription to access your video history.
            </p>
            <Link href='/pricing' className='btn-primary inline-block'>
              View Plans
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className='min-h-screen bg-dark-500 p-4 md:p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-col md:flex-row items-start md:items-center justify-between mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-white mb-2'>My Videos</h1>
              <p className='text-gray-300'>
                Your recently chatted YouTube videos
              </p>
            </div>

            <div className='mt-4 md:mt-0 relative w-full md:w-64'>
              <input
                type='text'
                placeholder='Search videos...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='input-primary w-full pl-10'
              />
              <Search
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                size={18}
              />
            </div>
          </div>

          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <FadeLoader color='#8975EA' />
            </div>
          ) : error ? (
            <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center'>
              <p className='text-red-200'>{error}</p>
              <button
                onClick={fetchVideos}
                className='mt-3 btn-secondary text-sm'
              >
                Try Again
              </button>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className='bg-dark-300 p-12 rounded-lg border border-dark-200 text-center'>
              {searchTerm ? (
                <>
                  <div className='mb-4 text-gray-400'>
                    <Search size={48} className='mx-auto opacity-30' />
                  </div>
                  <h3 className='text-xl font-bold text-white mb-2'>
                    No matching videos found
                  </h3>
                  <p className='text-gray-300 mb-4'>
                    No videos matched your search &quot;{searchTerm}&quot;
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className='btn-secondary'
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <div className='mb-4 text-primary-300'>
                    <Video size={48} className='mx-auto opacity-30' />
                  </div>
                  <h3 className='text-xl font-bold text-white mb-2'>
                    No video chats yet
                  </h3>
                  <p className='text-gray-300 mb-6'>
                    You haven&apos;t chatted with any YouTube videos yet. Start
                    by entering a YouTube URL on the home page.
                  </p>
                  <Link href='/' className='btn-primary'>
                    Chat with a Video
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredVideos.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.videoId}?chatId=${chat.id}`}
                  className='bg-dark-300 rounded-lg overflow-hidden border border-dark-200 hover:border-primary-500/30 transition-all group'
                >
                  <div className='relative aspect-video w-full bg-dark-400'>
                    {chat.thumbnail ? (
                      <Image
                        src={chat.thumbnail}
                        alt={chat.title}
                        fill
                        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                        className='object-cover'
                      />
                    ) : (
                      <div className='absolute inset-0 flex items-center justify-center text-gray-500'>
                        <Video size={48} />
                      </div>
                    )}
                  </div>
                  <div className='p-4'>
                    <h3 className='font-bold text-white mb-1 line-clamp-2 group-hover:text-primary-300 transition-colors'>
                      {chat.title}
                    </h3>
                    {chat.channelTitle && (
                      <p className='text-gray-400 text-sm mb-3'>
                        {chat.channelTitle}
                      </p>
                    )}

                    <div className='flex items-center justify-between mt-3'>
                      <div className='flex items-center gap-2 text-sm text-gray-400'>
                        <MessageSquare size={14} />
                        <span>{chat._count.messages} messages</span>
                      </div>
                      <div className='flex items-center gap-1 text-sm text-gray-400'>
                        <Clock size={14} />
                        <span>{formatRelativeTime(chat.updatedAt)}</span>
                      </div>
                    </div>

                    <div className='mt-3 pt-3 border-t border-dark-200 flex justify-between items-center'>
                      <span className='text-xs text-gray-500'>
                        <CalendarDays size={12} className='inline mr-1' />
                        Created {new Date(chat.createdAt).toLocaleDateString()}
                      </span>
                      <span className='text-primary-300 flex items-center gap-1 text-sm group-hover:translate-x-1 transition-transform'>
                        Continue <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
