'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import ChatInterface from '@/components/ChatInterface';
import { getVideoDetails } from '@/lib/youtube';
import { FadeLoader } from '@/components/ui/Loader';

interface VideoDetails {
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export default function ChatPage() {
  const { videoId } = useParams() as { videoId: string };
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        const details = await getVideoDetails(videoId);
        setVideoDetails(details);
      } catch (error) {
        console.error('Error fetching video details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideoDetails();
    }
  }, [videoId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <FadeLoader color='#8975EA' />
      </div>
    );
  }

  return (
    <div className='flex flex-col md:flex-row min-h-screen bg-dark-500'>
      <div className='md:w-1/2 p-4'>
        <VideoPlayer videoId={videoId} title={videoDetails?.title || 'Video'} />
        {videoDetails && (
          <div className='mt-4 p-4 bg-dark-300 rounded-lg'>
            <h1 className='text-xl font-bold mb-2'>{videoDetails.title}</h1>
            <p className='text-gray-300'>{videoDetails.channelTitle}</p>
          </div>
        )}
      </div>
      <div className='md:w-1/2 border-l border-dark-300'>
        <ChatInterface videoId={videoId} />
      </div>
    </div>
  );
}
