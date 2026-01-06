'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from './password-input';
import {
  loginSchema,
  signupSchema,
  type LoginFormData,
  type SignupFormData,
} from '@/lib/validations/auth';
import { cn } from '@/lib/utils';

type AuthFormData = LoginFormData | SignupFormData;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: AuthFormData) => Promise<void>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const schema = mode === 'login' ? loginSchema : signupSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(schema),
  });

  const submitHandler = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={submitHandler} className="space-y-4" role="form">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block font-body text-sm font-medium text-white"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn(
            'bg-primary-700 border-primary-600 text-white placeholder:text-primary-400',
            errors.email && 'border-red-500'
          )}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block font-body text-sm font-medium text-white"
        >
          Password
        </label>
        <PasswordInput
          id="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="Enter your password"
          className={cn(
            'bg-primary-700 border-primary-600 text-white placeholder:text-primary-400',
            errors.password && 'border-red-500'
          )}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {mode === 'login' && (
        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="font-body text-sm text-primary-300 hover:text-white"
          >
            Forgot password?
          </Link>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {mode === 'login' ? 'Signing in...' : 'Creating account...'}
          </>
        ) : mode === 'login' ? (
          'Sign in'
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-center font-body text-sm text-primary-300">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-white hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-white hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
