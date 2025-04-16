'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import ChatInterface from '@/components/ChatInterface';
import TranscriptionLoader from '@/components/TranscriptionLoader';
import { getVideoDetails } from '@/lib/youtube';
import { FadeLoader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import SubscriptionPrompt from '@/components/SubscriptionPrompt';

interface VideoDetails {
  title: string;
  thumbnail: string;
  channelTitle: string;
}

type TranscriptionStatus = 'not_started' | 'in_progress' | 'completed';

export default function ChatPage() {
  const { videoId } = useParams() as { videoId: string };
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<TranscriptionStatus>('not_started');
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const { status, subscriptionPlan, isSubscriptionActive } = useAuth();
  const router = useRouter();

  // Check if user has reached their limit (only for FREE plan)
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + encodeURI(`/chat/${videoId}`));
    }
  }, [status, router, videoId]);

  // Check if user has reached their limit
  useEffect(() => {
    if (status === 'authenticated' && subscriptionPlan === 'FREE') {
      const checkUsageLimit = async () => {
        try {
          const response = await fetch('/api/usage/check');
          const data = await response.json();
          setHasReachedLimit(data.hasReachedLimit);
        } catch (error) {
          console.error('Error checking usage limit:', error);
        }
      };

      checkUsageLimit();
    }
  }, [status, subscriptionPlan]);

  // Fetch video details and initial transcription status
  useEffect(() => {
    if (status !== 'authenticated' || !isSubscriptionActive) return;

    const fetchInitialData = async () => {
      try {
        // Get video details (title, thumbnail, etc)
        const details = await getVideoDetails(videoId);
        setVideoDetails(details);

        // Check initial transcription status
        const statusResponse = await fetch(
          `/api/transcription-status?videoId=${videoId}`
        );
        const statusData = await statusResponse.json();

        setTranscriptionStatus(statusData.status);
        if (statusData.progress) {
          setTranscriptionProgress(statusData.progress);
        }

        // If transcription not started or in progress, trigger it
        if (statusData.status !== 'completed') {
          await fetch('/api/start-transcription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoId }),
          });

          // If not already in progress, update status
          if (statusData.status !== 'in_progress') {
            setTranscriptionStatus('in_progress');
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (videoId && !hasReachedLimit) {
      fetchInitialData();
    } else if (hasReachedLimit) {
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [videoId, status, isSubscriptionActive, hasReachedLimit, pollingInterval]);

  // Set up polling for transcription status if in progress
  useEffect(() => {
    if (!isSubscriptionActive || hasReachedLimit) return;

    const pollTranscriptionStatus = async () => {
      try {
        const response = await fetch(
          `/api/transcription-status?videoId=${videoId}`
        );
        const data = await response.json();

        setTranscriptionStatus(data.status);
        if (data.progress !== undefined) {
          setTranscriptionProgress(data.progress);
        }

        // If completed, stop polling
        if (data.status === 'completed' && pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } catch (error) {
        console.error('Error polling transcription status:', error);
      }
    };

    // Start polling if transcription is in progress and we're not already polling
    if (transcriptionStatus === 'in_progress' && !pollingInterval) {
      // Initial poll
      pollTranscriptionStatus();

      // Set up regular polling
      const interval = setInterval(pollTranscriptionStatus, 3000); // Poll every 3 seconds
      setPollingInterval(interval);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [
    transcriptionStatus,
    videoId,
    pollingInterval,
    isSubscriptionActive,
    hasReachedLimit,
  ]);

  // Handle loading state
  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <FadeLoader color='#8975EA' />
      </div>
    );
  }

  // Handle unauthenticated users (should redirect, but just in case)
  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  // Show subscription prompt if user has reached their limit
  if (hasReachedLimit && subscriptionPlan === 'FREE') {
    return (
      <>
        <Header />
        <SubscriptionPrompt />
      </>
    );
  }

  // Handle inactive subscription
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
              subscription to continue using this feature.
            </p>
            <Link href='/pricing' className='btn-primary inline-block'>
              View Plans
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Loading state within the app
  if (loading) {
    return (
      <>
        <Header />
        <div className='flex items-center justify-center min-h-screen'>
          <FadeLoader color='#8975EA' />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className='flex flex-col md:flex-row min-h-screen bg-dark-500'>
        <div className='md:w-1/2 p-4'>
          <VideoPlayer
            videoId={videoId}
            title={videoDetails?.title || 'Video'}
          />
          {videoDetails && (
            <div className='mt-4 p-4 bg-dark-300 rounded-lg'>
              <h1 className='text-xl font-bold mb-2'>{videoDetails.title}</h1>
              <p className='text-gray-300'>{videoDetails.channelTitle}</p>
            </div>
          )}
        </div>
        <div className='md:w-1/2 border-l border-dark-300'>
          {transcriptionStatus === 'completed' ? (
            <ChatInterface videoId={videoId} />
          ) : (
            <div className='flex items-center justify-center h-full p-6'>
              <TranscriptionLoader progress={transcriptionProgress} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
