'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call your API to register the user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message and direct to email verification
      setSuccessMessage(
        'Account created! Please check your email to verify your account.'
      );

      // Sign in with email provider to trigger verification email
      await signIn('email', {
        email,
        redirect: false,
      });

      // Redirect to verify-request page after a short delay
      setTimeout(() => {
        router.push('/auth/verify-request');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className='flex flex-col min-h-screen items-center justify-center bg-dark-500 p-4'>
      <div className='w-full max-w-md p-6 bg-dark-300 rounded-lg shadow-md border border-primary-500/20'>
        <h1 className='text-2xl font-bold mb-6 text-center text-white'>
          Create an Account
        </h1>

        {error && (
          <div className='mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-200'>
            {error}
          </div>
        )}

        {successMessage && (
          <div className='mb-4 p-3 bg-green-500/20 border border-green-500 rounded-md text-green-200'>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label htmlFor='name' className='block mb-1 text-gray-300'>
              Name
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='input-primary w-full'
              disabled={loading}
            />
          </div>

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
            <p className='text-xs text-gray-400 mt-1'>
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block mb-1 text-gray-300'
            >
              Confirm Password
            </label>
            <input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className='input-primary w-full'
              disabled={loading}
            />
          </div>

          <button
            type='submit'
            className='btn-primary w-full'
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className='mt-4 flex items-center gap-2'>
          <hr className='flex-grow border-dark-100' />
          <span className='text-gray-400 text-sm'>or</span>
          <hr className='flex-grow border-dark-100' />
        </div>

        <button
          onClick={handleGoogleSignUp}
          className='btn-secondary w-full mt-4 flex items-center justify-center gap-2'
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
          Sign up with Google
        </button>

        <div className='mt-6 text-center text-gray-400 text-sm'>
          Already have an account?{' '}
          <Link
            href='/auth/signin'
            className='text-primary-300 hover:underline'
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
