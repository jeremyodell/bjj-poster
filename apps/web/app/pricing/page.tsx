'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckoutButton, UpgradeSuccessHandler } from '@/components/checkout';
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

interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: { name: string; included: boolean }[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for trying out',
    features: [
      { name: '2 posters per month', included: true },
      { name: '720p resolution', included: true },
      { name: 'Watermarked exports', included: true },
      { name: 'Background removal', included: false },
      { name: 'AI backgrounds', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    ctaLink: '/auth/signup?plan=free',
  },
  {
    name: 'Pro',
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    description: 'For serious athletes',
    features: [
      { name: '20 posters per month', included: true },
      { name: '1080p HD resolution', included: true },
      { name: 'No watermark', included: true },
      { name: 'Background removal', included: true },
      { name: 'AI backgrounds', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Start Pro Trial',
    ctaLink: '/auth/signup?plan=pro',
    popular: true,
  },
  {
    name: 'Premium',
    monthlyPrice: 29.99,
    annualPrice: 23.99,
    description: 'For professionals & teams',
    features: [
      { name: 'Unlimited posters', included: true },
      { name: '4K resolution', included: true },
      { name: 'No watermark', included: true },
      { name: 'Background removal', included: true },
      { name: 'AI backgrounds', included: true },
      { name: 'Priority support', included: true },
    ],
    cta: 'Go Premium',
    ctaLink: '/auth/signup?plan=premium',
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface PricingCardProps {
  tier: PricingTier;
  billingPeriod: BillingPeriod;
}

function PricingCard({ tier, billingPeriod }: PricingCardProps) {
  const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
  const formattedPrice = price === 0 ? '$0' : `$${price.toFixed(2)}`;

  return (
    <Card
      className={cn(
        'relative flex flex-col bg-primary-800 text-white',
        tier.popular && 'border-2 border-accent-gold lg:scale-105'
      )}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full border border-accent-gold bg-accent-gold/10 px-4 py-1 font-body text-sm text-accent-gold">
            Most Popular
          </span>
        </div>
      )}
      <CardHeader className={cn('text-center', tier.popular && 'pt-8')}>
        <h2 className="font-display text-2xl">{tier.name}</h2>
        <p className="font-body text-sm text-primary-300">{tier.description}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-6 text-center">
          <span className="font-display text-4xl">{formattedPrice}</span>
          <span className="font-body text-primary-300">/month</span>
          {billingPeriod === 'annual' && price > 0 && (
            <p className="mt-1 font-body text-sm text-primary-400">Billed annually</p>
          )}
        </div>
        <ul className="space-y-3" role="list">
          {tier.features.map((feature) => (
            <li
              key={feature.name}
              className={cn(
                'flex items-center gap-3 font-body text-sm',
                feature.included ? 'text-white' : 'text-primary-400'
              )}
            >
              {feature.included ? (
                <CheckIcon className="h-5 w-5 text-accent-gold" />
              ) : (
                <XIcon className="h-5 w-5 text-primary-500" />
              )}
              {feature.name}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {tier.monthlyPrice === 0 ? (
          <Button asChild variant={tier.popular ? 'default' : 'outline'} className="w-full">
            <Link href={tier.ctaLink}>{tier.cta}</Link>
          </Button>
        ) : (
          <CheckoutButton
            tier={tier.name.toLowerCase() as 'pro' | 'premium'}
            interval={billingPeriod === 'monthly' ? 'month' : 'year'}
            variant={tier.popular ? 'default' : 'outline'}
            className="w-full"
          >
            {tier.cta}
          </CheckoutButton>
        )}
      </CardFooter>
    </Card>
  );
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  return (
    <main className="min-h-screen bg-primary-900 px-6 py-20 lg:px-8">
      <UpgradeSuccessHandler />
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

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:items-start">
          {pricingTiers.map((tier) => (
            <div key={tier.name} className={cn(tier.popular && 'order-first lg:order-none')}>
              <PricingCard tier={tier} billingPeriod={billingPeriod} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
