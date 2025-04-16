'use client';

import Link from 'next/link';
import { Zap, Check } from 'lucide-react';

export default function SubscriptionPrompt() {
  return (
    <div className='flex items-center justify-center min-h-screen p-4 bg-dark-500'>
      <div className='max-w-2xl w-full p-6 bg-dark-300 rounded-lg shadow-lg border border-primary-500/20'>
        <div className='text-center mb-6'>
          <div className='p-3 bg-primary-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
            <Zap size={32} className='text-primary-300' />
          </div>
          <h2 className='text-2xl font-bold text-white mb-2'>
            Usage Limit Reached
          </h2>
          <p className='text-gray-300 max-w-md mx-auto'>
            You've reached the limit for your free plan. Upgrade to continue
            using our AI chat features with unlimited videos.
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-6 mt-8'>
          <div className='bg-dark-400 p-6 rounded-lg border border-primary-500/20 hover:border-primary-500/50 transition-all'>
            <div className='flex justify-between items-start mb-4'>
              <div>
                <h3 className='text-xl font-bold text-white'>Pro Plan</h3>
                <p className='text-gray-400'>For regular users</p>
              </div>
              <span className='bg-primary-500/20 text-primary-300 text-sm px-3 py-1 rounded-full'>
                Popular
              </span>
            </div>
            <div className='mb-4'>
              <span className='text-3xl font-bold text-white'>$9.99</span>
              <span className='text-gray-400'>/month</span>
            </div>
            <ul className='space-y-3 mb-6'>
              <li className='flex items-start gap-2'>
                <Check
                  size={20}
                  className='text-primary-300 flex-shrink-0 mt-0.5'
                />
                <span className='text-gray-300'>
                  Unlimited video transcriptions
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <Check
                  size={20}
                  className='text-primary-300 flex-shrink-0 mt-0.5'
                />
                <span className='text-gray-300'>Faster processing times</span>
              </li>
              <li className='flex items-start gap-2'>
                <Check
                  size={20}
                  className='text-primary-300 flex-shrink-0 mt-0.5'
                />
                <span className='text-gray-300'>
                  Save transcripts and chats
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <Check
                  size={20}
                  className='text-primary-300 flex-shrink-0 mt-0.5'
                />
                <span className='text-gray-300'>Priority support</span>
              </li>
            </ul>
            <Link
              href='/pricing#pro'
              className='btn-primary block text-center w-full'
            >
              Upgrade to Pro
            </Link>
          </div>

          <div className='bg-dark-400 p-6 rounded-lg border border-primary-500/20 hover:border-primary-500/50 transition-all'>
            <div className='mb-4'>
              <h3 className='text-xl font-bold text-white'>Max Plan</h3>
              <p className='text-gray-400'>For power users</p>
            </div>
            <div className='mb-4'>
              <span className='text-3xl font-bold text-white'>$19.99</span>
              <span className='text-gray-400'>/month</span>
            </div>
            <ul className='space-y-3 mb-6'>
              <li className='flex items-start gap-2'>
                <Check
                  size={20}
                  className='text-primary-300 flex-shrink-0 mt-0.5'
                />
                <span className='text-gray-300'>All Pro features</span>
              </li>
              <li className='flex items-start gap-2'>
                <Check
                  size={20}
                  className='text-primary-300 flex-shrink-0 mt-0.5'
                />
                <span className='text-gray-300'>
                  Highest quality AI responses
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <Check
                  size={20}
                  className='text-primary-300 flex-shrink-0 mt-0.5'
                />
                <span className='text-gray-300'>
                  Advanced social media generation
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <Check
                  size={20}
                  className='text-primary-300 flex-shrink-0 mt-0.5'
                />
                <span className='text-gray-300'>API access</span>
              </li>
            </ul>
            <Link
              href='/pricing#max'
              className='bg-dark-300 border border-primary-500 hover:bg-primary-500/10 text-white block text-center px-4 py-2 rounded-md transition-colors w-full'
            >
              Upgrade to Max
            </Link>
          </div>
        </div>

        <div className='mt-8 text-center'>
          <Link href='/' className='text-primary-300 hover:underline'>
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
