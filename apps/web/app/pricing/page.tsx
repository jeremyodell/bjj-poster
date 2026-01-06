'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

type BillingPeriod = 'monthly' | 'annual';

interface BillingToggleProps {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
}

function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className="mx-auto mt-10 inline-flex rounded-full bg-primary-800 p-1"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'monthly'}
        onClick={() => onChange('monthly')}
        className={cn(
          'rounded-full px-6 py-2 font-body text-sm font-medium transition-colors',
          value === 'monthly'
            ? 'bg-primary-600 text-white'
            : 'text-primary-300 hover:text-white'
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'annual'}
        onClick={() => onChange('annual')}
        className={cn(
          'flex items-center gap-2 rounded-full px-6 py-2 font-body text-sm font-medium transition-colors',
          value === 'annual'
            ? 'bg-primary-600 text-white'
            : 'text-primary-300 hover:text-white'
        )}
      >
        Annual
        <span className="rounded-full bg-accent-gold/20 px-2 py-0.5 text-xs text-accent-gold">
          Save 20%
        </span>
      </button>
    </div>
  );
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  return (
    <main className="min-h-screen bg-primary-900 px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="font-display text-4xl text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-primary-300">
            Choose the plan that fits your needs
          </p>
          <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
        </div>
      </div>
    </main>
  );
}
