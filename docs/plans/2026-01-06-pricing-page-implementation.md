# Pricing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a pricing comparison page with Free/Pro/Premium tiers, monthly/annual toggle, and tier-specific CTAs.

**Architecture:** Single page component at `apps/web/app/pricing/page.tsx` with client-side state for billing period toggle. Uses existing Card and Button components from shadcn/ui. Custom BillingToggle component for monthly/annual selection.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## Task 1: Write Failing Tests for Page Structure

**Files:**
- Create: `apps/web/app/pricing/__tests__/page.test.tsx`

**Step 1: Create test file with page structure tests**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PricingPage from '../page';

describe('Pricing Page', () => {
  describe('Page Structure', () => {
    it('renders the main heading', () => {
      render(<PricingPage />);
      expect(
        screen.getByRole('heading', { level: 1, name: /pricing/i })
      ).toBeInTheDocument();
    });

    it('renders a subheading', () => {
      render(<PricingPage />);
      expect(screen.getByText(/choose the plan/i)).toBeInTheDocument();
    });

    it('renders main landmark', () => {
      render(<PricingPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: FAIL - Cannot find module '../page'

**Step 3: Create minimal page to make test pass**

Create `apps/web/app/pricing/page.tsx`:

```tsx
export default function PricingPage() {
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
        </div>
      </div>
    </main>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/pricing/__tests__/page.test.tsx apps/web/app/pricing/page.tsx
git commit -m "test(web): add failing tests for pricing page structure"
```

---

## Task 2: Write Failing Tests for Billing Toggle

**Files:**
- Modify: `apps/web/app/pricing/__tests__/page.test.tsx`

**Step 1: Add billing toggle tests**

Add to the test file:

```tsx
import userEvent from '@testing-library/user-event';

// Add to describe('Pricing Page')
describe('Billing Toggle', () => {
  it('renders monthly and annual options', () => {
    render(<PricingPage />);
    expect(screen.getByRole('radio', { name: /monthly/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /annual/i })).toBeInTheDocument();
  });

  it('has monthly selected by default', () => {
    render(<PricingPage />);
    expect(screen.getByRole('radio', { name: /monthly/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /annual/i })).not.toBeChecked();
  });

  it('shows save 20% badge on annual option', () => {
    render(<PricingPage />);
    expect(screen.getByText(/save 20%/i)).toBeInTheDocument();
  });

  it('switches to annual when clicked', async () => {
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.click(screen.getByRole('radio', { name: /annual/i }));

    expect(screen.getByRole('radio', { name: /annual/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /monthly/i })).not.toBeChecked();
  });

  it('has proper radiogroup accessibility', () => {
    render(<PricingPage />);
    expect(screen.getByRole('radiogroup', { name: /billing period/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: FAIL - Unable to find role="radio"

**Step 3: Add BillingToggle component to page**

Update `apps/web/app/pricing/page.tsx`:

```tsx
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
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/pricing/__tests__/page.test.tsx apps/web/app/pricing/page.tsx
git commit -m "feat(web): add billing toggle with monthly/annual switching"
```

---

## Task 3: Write Failing Tests for Pricing Cards

**Files:**
- Modify: `apps/web/app/pricing/__tests__/page.test.tsx`

**Step 1: Add pricing card tests**

Add to the test file:

```tsx
describe('Pricing Cards', () => {
  it('renders three pricing tiers', () => {
    render(<PricingPage />);
    expect(screen.getByRole('heading', { level: 2, name: /free/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /pro/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /premium/i })).toBeInTheDocument();
  });

  it('shows Most Popular badge on Pro tier', () => {
    render(<PricingPage />);
    expect(screen.getByText(/most popular/i)).toBeInTheDocument();
  });

  it('renders monthly prices by default', () => {
    render(<PricingPage />);
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('shows /month text for all tiers', () => {
    render(<PricingPage />);
    const monthTexts = screen.getAllByText(/\/month/i);
    expect(monthTexts.length).toBe(3);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: FAIL - Unable to find heading "free"

**Step 3: Add pricing data and cards**

Update `apps/web/app/pricing/page.tsx` - add after BillingToggle component:

```tsx
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
            <p className="mt-1 font-body text-sm text-primary-400">
              Billed annually
            </p>
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
        <Button
          asChild
          variant={tier.popular ? 'default' : 'outline'}
          className="w-full"
        >
          <Link href={tier.ctaLink}>{tier.cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

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
```

Then update the return statement to include the cards grid:

```tsx
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

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:items-start">
          {pricingTiers.map((tier) => (
            <PricingCard
              key={tier.name}
              tier={tier}
              billingPeriod={billingPeriod}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/pricing/__tests__/page.test.tsx apps/web/app/pricing/page.tsx
git commit -m "feat(web): add pricing cards with tier data"
```

---

## Task 4: Write Failing Tests for Price Toggle Behavior

**Files:**
- Modify: `apps/web/app/pricing/__tests__/page.test.tsx`

**Step 1: Add price switching tests**

Add to the test file:

```tsx
describe('Price Toggle Behavior', () => {
  it('updates prices when switching to annual', async () => {
    const user = userEvent.setup();
    render(<PricingPage />);

    // Verify monthly prices first
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();

    // Switch to annual
    await user.click(screen.getByRole('radio', { name: /annual/i }));

    // Verify annual prices
    expect(screen.getByText('$7.99')).toBeInTheDocument();
    expect(screen.getByText('$23.99')).toBeInTheDocument();
  });

  it('shows "Billed annually" text when annual is selected', async () => {
    const user = userEvent.setup();
    render(<PricingPage />);

    expect(screen.queryByText(/billed annually/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /annual/i }));

    // Pro and Premium should show billed annually (Free is $0)
    const billedAnnually = screen.getAllByText(/billed annually/i);
    expect(billedAnnually.length).toBe(2);
  });

  it('Free tier price stays $0 for both periods', async () => {
    const user = userEvent.setup();
    render(<PricingPage />);

    expect(screen.getByText('$0')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /annual/i }));

    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it passes**

These tests should already pass with our implementation from Task 3.

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/app/pricing/__tests__/page.test.tsx
git commit -m "test(web): add price toggle behavior tests"
```

---

## Task 5: Write Failing Tests for CTAs

**Files:**
- Modify: `apps/web/app/pricing/__tests__/page.test.tsx`

**Step 1: Add CTA tests**

Add to the test file:

```tsx
describe('CTAs', () => {
  it('renders tier-specific CTA text', () => {
    render(<PricingPage />);
    expect(screen.getByRole('link', { name: /get started free/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start pro trial/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go premium/i })).toBeInTheDocument();
  });

  it('links to signup with correct plan query params', () => {
    render(<PricingPage />);
    expect(screen.getByRole('link', { name: /get started free/i })).toHaveAttribute(
      'href',
      '/auth/signup?plan=free'
    );
    expect(screen.getByRole('link', { name: /start pro trial/i })).toHaveAttribute(
      'href',
      '/auth/signup?plan=pro'
    );
    expect(screen.getByRole('link', { name: /go premium/i })).toHaveAttribute(
      'href',
      '/auth/signup?plan=premium'
    );
  });
});
```

**Step 2: Run test to verify it passes**

These tests should already pass with our implementation.

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/app/pricing/__tests__/page.test.tsx
git commit -m "test(web): add CTA link tests"
```

---

## Task 6: Write Failing Tests for Accessibility

**Files:**
- Modify: `apps/web/app/pricing/__tests__/page.test.tsx`

**Step 1: Add accessibility tests**

Add to the test file:

```tsx
describe('Accessibility', () => {
  it('has proper heading hierarchy', () => {
    render(<PricingPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h1).toBeInTheDocument();
    expect(h2s.length).toBe(3); // Free, Pro, Premium
  });

  it('feature lists have proper list role', () => {
    render(<PricingPage />);
    const lists = screen.getAllByRole('list');
    expect(lists.length).toBeGreaterThanOrEqual(3);
  });

  it('icons are hidden from screen readers', () => {
    render(<PricingPage />);
    const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it passes**

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/app/pricing/__tests__/page.test.tsx
git commit -m "test(web): add accessibility tests for pricing page"
```

---

## Task 7: Mobile Responsiveness - Reorder Pro Card

**Files:**
- Modify: `apps/web/app/pricing/page.tsx`

**Step 1: Add responsive ordering for Pro card**

Update the cards grid container in `page.tsx`:

```tsx
<div className="mt-16 grid gap-8 lg:grid-cols-3 lg:items-start">
  {pricingTiers.map((tier, index) => (
    <div
      key={tier.name}
      className={cn(
        tier.popular && 'order-first lg:order-none'
      )}
    >
      <PricingCard tier={tier} billingPeriod={billingPeriod} />
    </div>
  ))}
</div>
```

**Step 2: Verify visually in browser**

```bash
pnpm dev
```

Open http://localhost:3000/pricing and resize to mobile width. Pro card should appear first.

**Step 3: Run all tests to ensure nothing broke**

```bash
pnpm vitest:web run apps/web/app/pricing/__tests__/page.test.tsx
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/app/pricing/page.tsx
git commit -m "feat(web): add mobile-first ordering for Pro pricing card"
```

---

## Task 8: Run Full Quality Gates

**Step 1: Run all tests**

```bash
pnpm test
```

Expected: All tests pass

**Step 2: Run linter**

```bash
pnpm lint
```

Expected: No errors

**Step 3: Run type check**

```bash
pnpm type-check
```

Expected: No errors

**Step 4: Fix any issues**

If any issues found, fix them and run the commands again.

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(web): address lint and type errors"
```

---

## Task 9: Final Commit and Push

**Step 1: Verify clean git status**

```bash
git status
```

**Step 2: Push branch**

```bash
git push -u origin feat/ODE-63-ui-lnd-002-pricing-page
```

---

## Complete Test File Reference

The final `apps/web/app/pricing/__tests__/page.test.tsx` should look like:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PricingPage from '../page';

describe('Pricing Page', () => {
  describe('Page Structure', () => {
    it('renders the main heading', () => {
      render(<PricingPage />);
      expect(
        screen.getByRole('heading', { level: 1, name: /pricing/i })
      ).toBeInTheDocument();
    });

    it('renders a subheading', () => {
      render(<PricingPage />);
      expect(screen.getByText(/choose the plan/i)).toBeInTheDocument();
    });

    it('renders main landmark', () => {
      render(<PricingPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Billing Toggle', () => {
    it('renders monthly and annual options', () => {
      render(<PricingPage />);
      expect(screen.getByRole('radio', { name: /monthly/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /annual/i })).toBeInTheDocument();
    });

    it('has monthly selected by default', () => {
      render(<PricingPage />);
      expect(screen.getByRole('radio', { name: /monthly/i })).toBeChecked();
      expect(screen.getByRole('radio', { name: /annual/i })).not.toBeChecked();
    });

    it('shows save 20% badge on annual option', () => {
      render(<PricingPage />);
      expect(screen.getByText(/save 20%/i)).toBeInTheDocument();
    });

    it('switches to annual when clicked', async () => {
      const user = userEvent.setup();
      render(<PricingPage />);

      await user.click(screen.getByRole('radio', { name: /annual/i }));

      expect(screen.getByRole('radio', { name: /annual/i })).toBeChecked();
      expect(screen.getByRole('radio', { name: /monthly/i })).not.toBeChecked();
    });

    it('has proper radiogroup accessibility', () => {
      render(<PricingPage />);
      expect(screen.getByRole('radiogroup', { name: /billing period/i })).toBeInTheDocument();
    });
  });

  describe('Pricing Cards', () => {
    it('renders three pricing tiers', () => {
      render(<PricingPage />);
      expect(screen.getByRole('heading', { level: 2, name: /free/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /pro/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /premium/i })).toBeInTheDocument();
    });

    it('shows Most Popular badge on Pro tier', () => {
      render(<PricingPage />);
      expect(screen.getByText(/most popular/i)).toBeInTheDocument();
    });

    it('renders monthly prices by default', () => {
      render(<PricingPage />);
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$9.99')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });

    it('shows /month text for all tiers', () => {
      render(<PricingPage />);
      const monthTexts = screen.getAllByText(/\/month/i);
      expect(monthTexts.length).toBe(3);
    });
  });

  describe('Price Toggle Behavior', () => {
    it('updates prices when switching to annual', async () => {
      const user = userEvent.setup();
      render(<PricingPage />);

      expect(screen.getByText('$9.99')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();

      await user.click(screen.getByRole('radio', { name: /annual/i }));

      expect(screen.getByText('$7.99')).toBeInTheDocument();
      expect(screen.getByText('$23.99')).toBeInTheDocument();
    });

    it('shows "Billed annually" text when annual is selected', async () => {
      const user = userEvent.setup();
      render(<PricingPage />);

      expect(screen.queryByText(/billed annually/i)).not.toBeInTheDocument();

      await user.click(screen.getByRole('radio', { name: /annual/i }));

      const billedAnnually = screen.getAllByText(/billed annually/i);
      expect(billedAnnually.length).toBe(2);
    });

    it('Free tier price stays $0 for both periods', async () => {
      const user = userEvent.setup();
      render(<PricingPage />);

      expect(screen.getByText('$0')).toBeInTheDocument();

      await user.click(screen.getByRole('radio', { name: /annual/i }));

      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });

  describe('CTAs', () => {
    it('renders tier-specific CTA text', () => {
      render(<PricingPage />);
      expect(screen.getByRole('link', { name: /get started free/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /start pro trial/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go premium/i })).toBeInTheDocument();
    });

    it('links to signup with correct plan query params', () => {
      render(<PricingPage />);
      expect(screen.getByRole('link', { name: /get started free/i })).toHaveAttribute(
        'href',
        '/auth/signup?plan=free'
      );
      expect(screen.getByRole('link', { name: /start pro trial/i })).toHaveAttribute(
        'href',
        '/auth/signup?plan=pro'
      );
      expect(screen.getByRole('link', { name: /go premium/i })).toHaveAttribute(
        'href',
        '/auth/signup?plan=premium'
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<PricingPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBe(3);
    });

    it('feature lists have proper list role', () => {
      render(<PricingPage />);
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThanOrEqual(3);
    });

    it('icons are hidden from screen readers', () => {
      render(<PricingPage />);
      const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });
});
```
