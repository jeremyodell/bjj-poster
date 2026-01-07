'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AuthForm } from '@/components/auth/auth-form';
import type { SignupFormData } from '@/lib/validations/auth';

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: SignupFormData): Promise<void> => {
    setError(null);
    try {
      // Mock delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Implement actual signup logic
      void data; // Suppress unused variable warning until real implementation

      router.push('/');
    } catch (err) {
      setError('Signup failed. Please try again later.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Signup error:', err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl text-white">Create your account</h1>
        <p className="mt-2 font-body text-sm text-primary-300">
          Start creating tournament posters
        </p>
      </div>
      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 p-3 text-center text-sm text-red-500">
          {error}
        </div>
      )}
      <AuthForm mode="signup" onSubmit={handleSubmit} />
    </>
  );
}
