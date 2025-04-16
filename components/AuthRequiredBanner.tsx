'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function AuthRequiredBanner() {
  const { status } = useAuth();

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className='w-full max-w-2xl mb-6 p-4 rounded-lg bg-primary-500/10 border border-primary-500/30 flex items-center gap-3'>
      <div className='bg-primary-500/20 p-2 rounded-full'>
        <ShieldAlert size={20} className='text-primary-400' />
      </div>
      <div className='flex-1'>
        <p className='text-gray-200'>
          <span className='font-medium'>Sign up required:</span> You&apos;ll
          need to create an account to chat with videos and use our AI features.
        </p>
      </div>
      <div className='flex-shrink-0 flex gap-2'>
        <Link href='/auth/signup' className='btn-primary py-1 text-sm'>
          Sign Up
        </Link>
        <Link href='/auth/signin' className='btn-secondary py-1 text-sm'>
          Sign In
        </Link>
      </div>
    </div>
  );
}
