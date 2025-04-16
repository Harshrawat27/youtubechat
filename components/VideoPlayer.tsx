'use client';

import { useState, useRef } from 'react';
import YouTube, { YouTubePlayer, YouTubeEvent } from 'react-youtube';

interface VideoPlayerProps {
  videoId: string;
  title: string;
}

export default function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  const [playerState, setPlayerState] = useState(-1);
  const playerRef = useRef<YouTubePlayer | null>(null);

  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setPlayerState(event.target.getPlayerState());
  };

  const onPlayerStateChange = (event: YouTubeEvent) => {
    setPlayerState(event.target.getPlayerState());
  };

  const seekToTime = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
    }
  };

  // Make seekToTime available globally
  if (typeof window !== 'undefined') {
    (window as any).seekToVideoTime = seekToTime;
  }

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className='relative aspect-video bg-dark-400 rounded-lg overflow-hidden'>
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onPlayerReady}
        onStateChange={onPlayerStateChange}
        className='absolute top-0 left-0 w-full h-full'
        title={title}
      />
    </div>
  );
}
