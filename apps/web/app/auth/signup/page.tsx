'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Sparkles, Check, Crown, Rocket, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { toast } from 'sonner';
import { AuthForm } from '@/components/auth/auth-form';
import type { SignupFormData } from '@/lib/validations/auth';
import { createCheckoutSession } from '@/lib/api/checkout';
import { easings } from '@/lib/animations';
import { cn } from '@/lib/utils';

const freeTier = {
  id: 'free',
  name: 'Free',
  price: '$0',
  icon: Zap,
  features: ['2 posters/month', '720p'],
  popular: false,
} as const;

const tiers = [
  freeTier,
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    icon: Rocket,
    features: ['20 posters/month', '1080p HD', 'No watermark'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$29.99',
    icon: Crown,
    features: ['Unlimited', '4K', 'AI backgrounds'],
    popular: false,
  },
] as const;

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan');
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(planFromUrl || 'free');

  const handleSubmit = async (data: SignupFormData): Promise<void> => {
    setError(null);
    try {
      // Mock delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Implement actual signup logic
      void data; // Suppress unused variable warning until real implementation

      // Route based on selected plan
      if (selectedPlan === 'free') {
        // Free tier: go directly to builder to start creating
        router.push('/builder');
      } else {
        // Pro/Premium tier: redirect to Stripe checkout
        const toastId = toast.loading('Setting up your subscription...');
        try {
          const tier = selectedPlan as 'pro' | 'premium';
          const { url } = await createCheckoutSession({ tier, interval: 'month' });
          toast.dismiss(toastId);
          window.location.href = url;
        } catch (checkoutError) {
          toast.dismiss(toastId);
          // If checkout fails, still let user in with free tier and show pricing
          toast.error('Could not start checkout. You can upgrade anytime from the dashboard.');
          router.push('/builder');
        }
      }
    } catch (err) {
      setError('Signup failed. Please try again later.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Signup error:', err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  const selectedTier = tiers.find(t => t.id === selectedPlan) ?? freeTier;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easings.easeOut }}
        className="mb-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: easings.elastic }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-3.5 w-3.5 text-gold-500" />
          </motion.div>
          <span className="text-xs font-medium text-gold-400">
            {selectedPlan === 'free' ? 'Free to start' : `Starting with ${selectedTier.name}`}
          </span>
        </motion.div>

        <h1 className="font-display text-3xl tracking-wide text-white">
          CREATE ACCOUNT
        </h1>
        <p className="mt-2 text-surface-400">
          Start creating championship posters
        </p>
      </motion.div>

      {/* Compact Plan Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: easings.easeOut }}
        className="mb-6"
      >
        <div className="flex gap-2">
          {tiers.map((tier) => {
            const TierIcon = tier.icon;
            const isSelected = selectedPlan === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedPlan(tier.id)}
                className={cn(
                  'relative flex-1 rounded-lg border p-3 text-center transition-all duration-200',
                  isSelected
                    ? 'border-gold-500/50 bg-gold-500/10'
                    : 'border-surface-700 bg-surface-800/50 hover:border-surface-600'
                )}
              >
                {tier.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-surface-950">
                    POPULAR
                  </span>
                )}
                <TierIcon className={cn(
                  'mx-auto h-4 w-4 mb-1',
                  isSelected ? 'text-gold-500' : 'text-surface-400'
                )} />
                <div className={cn(
                  'font-display text-sm',
                  isSelected ? 'text-white' : 'text-surface-300'
                )}>
                  {tier.name}
                </div>
                <div className={cn(
                  'text-xs',
                  isSelected ? 'text-gold-400' : 'text-surface-500'
                )}>
                  {tier.price}/mo
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected plan features */}
        <motion.div
          key={selectedPlan}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1"
        >
          {selectedTier.features.map((feature) => (
            <span key={feature} className="flex items-center gap-1 text-xs text-surface-400">
              <Check className="h-3 w-3 text-gold-500" />
              {feature}
            </span>
          ))}
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: easings.easeOut }}
            className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: easings.easeOut }}
      >
        <AuthForm mode="signup" onSubmit={handleSubmit} />
      </motion.div>

      {/* View full pricing link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-center"
      >
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-xs text-surface-500 hover:text-gold-400 transition-colors"
        >
          Compare all plans
          <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.div>
    </>
  );
}
