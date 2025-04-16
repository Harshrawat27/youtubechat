import React from 'react';
import { FadeLoader } from '@/components/ui/Loader';

interface TranscriptionLoaderProps {
  progress?: number;
}

export default function TranscriptionLoader({
  progress = 0,
}: TranscriptionLoaderProps) {
  // Get stage description based on progress
  const getStageDescription = () => {
    if (progress < 15) {
      return 'Downloading video...';
    } else if (progress < 30) {
      return 'Extracting audio...';
    } else if (progress < 90) {
      return 'Transcribing audio...';
    } else {
      return 'Finalizing transcript...';
    }
  };

  // Estimate remaining time based on progress
  const getTimeEstimate = () => {
    // This is a very rough estimate
    if (progress < 15) {
      return '(This might take a few minutes)';
    } else if (progress < 30) {
      return '(Almost ready to start transcribing)';
    } else if (progress < 90) {
      return `(Approximately ${Math.ceil(
        (100 - progress) / 10
      )} minutes remaining)`;
    } else {
      return '(Almost done!)';
    }
  };

  return (
    <div className='flex flex-col items-center justify-center p-8 bg-dark-300 rounded-lg border border-primary-500/20 min-h-[300px]'>
      <FadeLoader color='#8975EA' />

      <h3 className='mt-6 text-xl font-bold text-white'>Transcribing Video</h3>

      <div className='w-full max-w-md mt-6'>
        <div className='h-2 bg-dark-200 rounded-full overflow-hidden'>
          <div
            className='h-full bg-primary-500 transition-all duration-300'
            style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
          />
        </div>
        <div className='flex justify-between mt-2 text-sm text-gray-400'>
          <span>{getStageDescription()}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
      </div>

      <p className='mt-3 text-center text-gray-300 max-w-md'>
        We're creating a detailed transcript of this video to enable accurate
        responses to your questions.
      </p>

      <p className='mt-2 text-center text-gray-400 text-sm'>
        {getTimeEstimate()}
      </p>

      <div className='flex flex-col items-center mt-6 bg-dark-400 p-4 rounded-md'>
        <p className='text-sm text-gray-300'>
          <span className='font-medium text-primary-300'>
            About this process:
          </span>{' '}
          Longer videos require more processing time. We're splitting this video
          into smaller chunks and transcribing each one for better accuracy.
        </p>
      </div>
    </div>
  );
}
