'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        setFormError(result.error);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      setFormError('An error occurred during sign in');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  const handleEmailSignIn = () => {
    if (!email) {
      setFormError('Please enter your email');
      return;
    }
    signIn('email', { email, callbackUrl });
  };

  return (
    <div className='flex flex-col min-h-screen items-center justify-center bg-dark-500 p-4'>
      <div className='w-full max-w-md p-6 bg-dark-300 rounded-lg shadow-md border border-primary-500/20'>
        <h1 className='text-2xl font-bold mb-6 text-center text-white'>
          Sign In
        </h1>

        {error && (
          <div className='mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-200'>
            {error === 'CredentialsSignin' && 'Invalid credentials'}
            {error === 'EmailSignin' && 'Error sending email'}
            {error === 'OAuthSignin' && 'Error during OAuth sign in'}
            {error === 'Verification' &&
              'Email not verified. Please check your inbox.'}
            {error !== 'CredentialsSignin' &&
              error !== 'EmailSignin' &&
              error !== 'OAuthSignin' &&
              error !== 'Verification' &&
              'An error occurred'}
          </div>
        )}

        {formError && (
          <div className='mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-200'>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label htmlFor='email' className='block mb-1 text-gray-300'>
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='input-primary w-full'
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor='password' className='block mb-1 text-gray-300'>
              Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='input-primary w-full'
              disabled={loading}
            />
          </div>

          <button
            type='submit'
            className='btn-primary w-full'
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Email & Password'}
          </button>
        </form>

        <div className='mt-4 flex items-center gap-2'>
          <hr className='flex-grow border-dark-100' />
          <span className='text-gray-400 text-sm'>or</span>
          <hr className='flex-grow border-dark-100' />
        </div>

        <button
          onClick={handleEmailSignIn}
          className='btn-secondary w-full mt-4'
          disabled={loading}
        >
          Sign in with Magic Link
        </button>

        <button
          onClick={handleGoogleSignIn}
          className='btn-secondary w-full mt-3 flex items-center justify-center gap-2'
          disabled={loading}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            height='20'
            viewBox='0 0 48 48'
          >
            <path
              fill='#FFC107'
              d='M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z'
            />
            <path
              fill='#FF3D00'
              d='M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z'
            />
            <path
              fill='#4CAF50'
              d='M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z'
            />
            <path
              fill='#1976D2'
              d='M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z'
            />
          </svg>
          Sign in with Google
        </button>

        <div className='mt-6 text-center text-gray-400 text-sm'>
          Don&apos;t have an account?{' '}
          <Link
            href='/auth/signup'
            className='text-primary-300 hover:underline'
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
