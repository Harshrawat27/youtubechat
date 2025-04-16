'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FadeLoader } from '@/components/ui/Loader';
import { Mail, ArrowLeft } from 'lucide-react';

export default function VerifyRequest() {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center p-4 bg-dark-500'>
      <div className='w-full max-w-md p-6 bg-dark-300 rounded-lg shadow-md border border-primary-500/20 text-center'>
        <div className='mb-6 p-3 bg-primary-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto'>
          <Mail size={32} className='text-primary-300' />
        </div>

        <h1 className='text-2xl font-bold mb-4 text-white'>Check your email</h1>

        <p className='text-gray-300 mb-6'>
          A verification link has been sent to your email address. Please check
          your inbox and click the link to verify your account.
        </p>

        <div className='mb-6'>
          <FadeLoader color='#8975EA' />
        </div>

        <div className='text-sm text-gray-400 mb-6'>
          {timeLeft > 0 ? (
            <p>You can request a new verification link in {timeLeft} seconds</p>
          ) : (
            <p>
              Didn&apos;t receive an email?{' '}
              <button
                onClick={() => setTimeLeft(60)}
                className='text-primary-300 hover:underline'
              >
                Resend verification link
              </button>
            </p>
          )}
        </div>

        <Link
          href='/auth/signin'
          className='btn-secondary flex items-center justify-center gap-2 mx-auto w-full max-w-xs'
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
