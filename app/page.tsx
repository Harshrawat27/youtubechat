import React from 'react';
import VideoLinkInput from '@/components/VideoLinkInput';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-dark-500'>
      <div className='z-10 max-w-5xl w-full flex flex-col items-center justify-center gap-8'>
        <div className='flex flex-col items-center text-center'>
          <h1 className='text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-600'>
            Chat with YouTube Videos
          </h1>
          <p className='text-xl mb-8 max-w-2xl text-gray-300'>
            Enter a YouTube video link and start asking questions about the
            content. Get answers with timestamps or generate social media
            content from videos.
          </p>
        </div>

        <VideoLinkInput />

        <div className='flex items-center gap-3 mt-4'>
          <span className='text-gray-400'>or</span>
          <Link href='/chat' className='btn-secondary'>
            Chat with our AI assistant
          </Link>
        </div>

        <div className='mt-16 grid grid-cols-1 md:grid-cols-4 gap-8 w-full'>
          <Feature
            icon='search'
            title='Find Specific Topics'
            description='Ask where specific topics are discussed and get precise timestamps.'
          />
          <Feature
            icon='message-square'
            title='Chat with Content'
            description='Have a conversation about the video content with our AI assistant.'
          />
          <Feature
            icon='twitter'
            title='Social Media Content'
            description='Create Twitter posts and threads from video content.'
          />
          <Feature
            icon='clock'
            title='Save Time'
            description='Quickly find the information you need without watching the entire video.'
          />
        </div>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className='flex flex-col items-center text-center p-6 rounded-lg bg-dark-300 border border-primary-500/20 hover:border-primary-500/50 transition-all'>
      <div className='mb-4 p-3 rounded-full bg-primary-500/20'>
        <Image
          src={`/icons/${icon}.svg`}
          alt={title}
          width={24}
          height={24}
          className='text-primary-500'
        />
      </div>
      <h3 className='text-xl font-bold mb-2'>{title}</h3>
      <p className='text-gray-300'>{description}</p>
    </div>
  );
}
