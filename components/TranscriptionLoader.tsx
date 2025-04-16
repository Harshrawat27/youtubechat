import React from 'react';
import { FadeLoader } from '@/components/ui/Loader';

interface TranscriptionLoaderProps {
  progress?: number;
}

export default function TranscriptionLoader({
  progress,
}: TranscriptionLoaderProps) {
  return (
    <div className='flex flex-col items-center justify-center p-8 bg-dark-300 rounded-lg border border-primary-500/20 min-h-[300px]'>
      <FadeLoader color='#8975EA' />

      <h3 className='mt-6 text-xl font-bold text-white'>Transcribing Video</h3>

      <p className='mt-3 text-center text-gray-300 max-w-md'>
        We're creating a detailed transcript of this video to enable accurate
        responses to your questions. This may take a few minutes depending on
        the video length.
      </p>

      {progress !== undefined && (
        <div className='w-full max-w-md mt-6'>
          <div className='h-2 bg-dark-200 rounded-full overflow-hidden'>
            <div
              className='h-full bg-primary-500 transition-all duration-300'
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>
          <p className='mt-2 text-sm text-center text-gray-400'>
            {progress < 100 ? 'Processing...' : 'Almost done...'}
          </p>
        </div>
      )}

      <div className='flex flex-col items-center mt-6'>
        <p className='text-sm text-gray-400'>
          You'll be able to ask questions once the transcription is complete
        </p>
      </div>
    </div>
  );
}
