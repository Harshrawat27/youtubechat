'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { extractVideoId } from '@/lib/youtube';

export default function VideoLinkInput() {
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const videoId = extractVideoId(videoUrl);

      if (!videoId) {
        setError(
          'Invalid YouTube URL. Please enter a valid YouTube video link.'
        );
        return;
      }

      // Check if video exists and is accessible
      const response = await fetch(`/api/check-video?videoId=${videoId}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Video not found or inaccessible.');
        return;
      }

      // Redirect to chat page
      router.push(`/chat/${videoId}`);
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-xl'>
      <form onSubmit={handleSubmit} className='w-full'>
        <div className='flex flex-col sm:flex-row gap-3'>
          <input
            type='text'
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder='Paste a YouTube video URL...'
            className='input-primary flex-grow text-lg'
            disabled={loading}
          />
          <button
            type='submit'
            className='btn-primary flex items-center justify-center gap-2 text-lg'
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className='animate-spin h-5 w-5 mr-2' viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                    fill='none'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Loading...
              </>
            ) : (
              'Chat Now'
            )}
          </button>
        </div>
      </form>

      {error && <div className='mt-3 text-red-500 text-sm'>{error}</div>}

      <div className='mt-4 text-sm text-gray-400'>
        Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
      </div>
    </div>
  );
}
