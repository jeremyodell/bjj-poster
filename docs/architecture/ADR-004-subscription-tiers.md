# ADR-004: Subscription Tier Specifications

**Status:** Accepted
**Date:** 2025-01-05
**Decision Makers:** Technical Lead, Product, Finance
**Stakeholders:** Full team, End users

---

## Context

The BJJ Poster Builder is a subscription-based SaaS product. We need to define:

1. **Pricing tiers** - Free, Pro, Premium levels
2. **Feature gates** - What each tier unlocks
3. **Usage limits** - Quotas and rate limiting
4. **Enforcement mechanisms** - How to prevent abuse and enforce limits

### Business Goals

- **Acquisition:** Free tier should provide genuine value to drive signups
- **Conversion:** Pro tier should be the primary revenue driver (target: 15% conversion)
- **Retention:** Premium tier should serve power users without cannibalizing Pro
- **Margin:** Maintain >90% gross margin across all tiers

---

## Decision

### Tier Specifications

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| **Price** | $0/mo | $9.99/mo | $29.99/mo |
| **Posters per month** | 2 | 20 | Unlimited |
| **Output resolution** | 720p (watermarked) | 1080p (no watermark) | 4K (no watermark) |
| **Template access** | 5 basic templates | All 30+ templates | All templates + early access |
| **Background generation** | Pre-generated only | Pre-generated only | Custom AI generation |
| **Background removal** | Manual crop only | Included | Included |
| **Commercial use** | ❌ Personal only | ✅ Allowed | ✅ Allowed |
| **Storage** | 7 days | 6 months | Unlimited |
| **Priority support** | ❌ | ❌ | ✅ Email support |
| **API access** | ❌ | ❌ | ✅ (coming soon) |

### Target Conversion Funnel

```
1000 Signups (Free)
  └─► 150 convert to Pro (15%)
      └─► 25 upgrade to Premium (16.7% of Pro)

Monthly Revenue:
  Free:    0 × $0 = $0
  Pro:   150 × $9.99 = $1,498.50
  Premium: 25 × $29.99 = $749.75

Total MRR: $2,248.25
```

---

## Rationale

### Free Tier: "Try Before You Buy"

**2 posters/month** is enough to:
- Generate one poster for yourself + one for a teammate
- Understand the product value
- Not enough for serious use (forces conversion)

**720p with watermark** because:
- Usable for Instagram stories (720×1280)
- Visible watermark ("Made with BJJ Poster Builder") drives viral growth
- Not suitable for printing or professional use

**Why 2 and not 1?**
- Single-use trials feel stingy, reduce trust
- 2 posters allow testing different templates
- Higher engagement → higher conversion

### Pro Tier: "The Sweet Spot"

**$9.99/month** based on competitive analysis:

| Competitor | Product | Price | Features |
|------------|---------|-------|----------|
| Canva Pro | Design tool | $12.99/mo | Templates, stock photos |
| Adobe Express | Design tool | $9.99/mo | Templates, brand kit |
| PhotoPea | Image editor | $9/mo | Photoshop-like editing |
| **Our positioning** | **BJJ-specific** | **$9.99/mo** | **Niche specialization** |

**20 posters/month** because:
- Average gym has 50-100 active competitors
- Coaches/team admins want to create posters for their team
- 20 posters = 4-5 events/month (reasonable for active competitor)

**1080p no watermark** because:
- Industry standard for Instagram posts (1080×1080, 1080×1350)
- Suitable for Facebook, Twitter, other social media
- Good enough for 8×10" prints at 150 DPI

### Premium Tier: "Power Users & Gyms"

**$29.99/month** targets:
- Gym owners creating posters for entire teams
- Professional designers serving multiple clients
- Event organizers generating bulk posters

**Unlimited posters** because:
- Cost per poster is ~$0.002 (composition only)
- Even 1000 posters/month = $2 marginal cost
- Risk: Need monitoring to prevent abuse

**Custom AI backgrounds** because:
- Clear differentiation from Pro
- Bedrock cost ($0.02/poster) is manageable at this price point
- Justifies 3x price increase over Pro

**4K resolution** because:
- Suitable for large format printing (24×36" posters)
- Professional photography quality
- Marginal cost: negligible (S3 storage only)

---

## Implementation Guide

### 1. Database Schema

```typescript
// packages/db/src/types/user.ts
export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface User {
  id: string;
  email: string;

  // Subscription
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart?: string; // ISO date
  currentPeriodEnd?: string; // ISO date

  // Usage tracking
  postersThisMonth: number;
  lastResetDate: string; // ISO date (when counter was last reset)

  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

### 2. Tier Configuration

```typescript
// packages/core/src/config/subscription-tiers.ts
export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  priceMonthly: number;
  stripePriceId: string; // From Stripe Dashboard
  limits: {
    postersPerMonth: number | 'unlimited';
    maxResolution: { width: number; height: number };
    allowWatermarkRemoval: boolean;
    allowCustomAI: boolean;
    allowBackgroundRemoval: boolean;
    allowCommercialUse: boolean;
    storageDays: number | 'unlimited';
  };
  features: string[]; // For marketing page
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    stripePriceId: '', // No Stripe price for free tier
    limits: {
      postersPerMonth: 2,
      maxResolution: { width: 720, height: 900 },
      allowWatermarkRemoval: false,
      allowCustomAI: false,
      allowBackgroundRemoval: false,
      allowCommercialUse: false,
      storageDays: 7,
    },
    features: [
      '2 posters per month',
      '720p resolution',
      '5 basic templates',
      'Watermarked output',
    ],
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9.99,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    limits: {
      postersPerMonth: 20,
      maxResolution: { width: 1080, height: 1350 },
      allowWatermarkRemoval: true,
      allowCustomAI: false,
      allowBackgroundRemoval: true,
      allowCommercialUse: true,
      storageDays: 180, // 6 months
    },
    features: [
      '20 posters per month',
      '1080p HD resolution',
      'All 30+ templates',
      'No watermark',
      'Background removal',
      'Commercial use allowed',
      '6-month storage',
    ],
  },

  premium: {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 29.99,
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    limits: {
      postersPerMonth: 'unlimited',
      maxResolution: { width: 3840, height: 4800 },
      allowWatermarkRemoval: true,
      allowCustomAI: true,
      allowBackgroundRemoval: true,
      allowCommercialUse: true,
      storageDays: 'unlimited',
    },
    features: [
      'Unlimited posters',
      '4K ultra HD resolution',
      'All templates + early access',
      'Custom AI backgrounds',
      'Background removal',
      'Commercial use allowed',
      'Unlimited storage',
      'Priority email support',
    ],
  },
};

export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return SUBSCRIPTION_TIERS[tier];
}
```

### 3. Usage Enforcement

```typescript
// packages/core/src/services/subscription-service.ts
import { User } from '@bjj-poster/db';
import { getTierConfig } from '../config/subscription-tiers';

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export async function checkPosterQuota(user: User): Promise<void> {
  const tierConfig = getTierConfig(user.subscriptionTier);

  // Reset counter if we're in a new billing period
  const now = new Date();
  const lastReset = new Date(user.lastResetDate);

  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    // New month - reset counter
    user.postersThisMonth = 0;
    user.lastResetDate = now.toISOString();
    await updateUser(user.id, {
      postersThisMonth: 0,
      lastResetDate: user.lastResetDate,
    });
  }

  // Check quota
  if (tierConfig.limits.postersPerMonth !== 'unlimited') {
    if (user.postersThisMonth >= tierConfig.limits.postersPerMonth) {
      throw new QuotaExceededError(
        `You've reached your monthly limit of ${tierConfig.limits.postersPerMonth} posters. ` +
        `Upgrade to ${user.subscriptionTier === 'free' ? 'Pro' : 'Premium'} for more.`
      );
    }
  }
}

export async function incrementPosterCount(userId: string): Promise<void> {
  await updateUser(userId, {
    postersThisMonth: { $add: 1 }, // DynamoDB atomic counter
  });
}

export function checkFeatureAccess(
  user: User,
  feature: keyof TierConfig['limits']
): boolean {
  const tierConfig = getTierConfig(user.subscriptionTier);
  return tierConfig.limits[feature] as boolean;
}

export function getMaxResolution(user: User): { width: number; height: number } {
  const tierConfig = getTierConfig(user.subscriptionTier);
  return tierConfig.limits.maxResolution;
}
```

### 4. Lambda Handler Integration

```typescript
// apps/api/src/handlers/poster/create-poster.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getUserById } from '@bjj-poster/db';
import { checkPosterQuota, incrementPosterCount, QuotaExceededError } from '@bjj-poster/core';

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;

  try {
    const user = await getUserById(userId);

    // Check if user has quota remaining
    await checkPosterQuota(user);

    // Create poster...
    const poster = await createPoster({
      userId,
      ...JSON.parse(event.body!),
    });

    // Increment usage counter
    await incrementPosterCount(userId);

    return {
      statusCode: 202,
      body: JSON.stringify({
        posterId: poster.id,
        status: 'PENDING',
        message: 'Poster generation started',
      }),
    };

  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return {
        statusCode: 429, // Too Many Requests
        body: JSON.stringify({
          error: 'quota_exceeded',
          message: error.message,
          upgradeUrl: '/pricing',
        }),
      };
    }

    throw error;
  }
};
```

### 5. Watermark Rendering

```typescript
// packages/core/src/image-composition/watermark.ts
import sharp from 'sharp';

export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const watermarkSvg = `
    <svg width="1080" height="100">
      <rect width="1080" height="100" fill="#00000099" />
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial"
        font-size="36"
        fill="#FFFFFF"
        opacity="0.9"
      >
        Made with BJJ Poster Builder • bjjposter.app
      </text>
    </svg>
  `;

  return sharp(imageBuffer)
    .composite([{
      input: Buffer.from(watermarkSvg),
      gravity: 'south', // Bottom of image
    }])
    .toBuffer();
}

// In rendering pipeline
if (!tierConfig.limits.allowWatermarkRemoval) {
  outputBuffer = await addWatermark(outputBuffer);
}
```

### 6. Stripe Webhook Handler

```typescript
// apps/api/src/handlers/billing/stripe-webhook.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import Stripe from 'stripe';
import { updateUser, getUserByStripeCustomerId } from '@bjj-poster/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const sig = event.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return { statusCode: 400, body: 'Invalid signature' };
  }

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;

      await updateUser(session.metadata!.userId, {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        subscriptionTier: session.metadata!.tier as SubscriptionTier,
        subscriptionStatus: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const user = await getUserByStripeCustomerId(subscription.customer as string);

      // Determine tier from Stripe price ID
      let tier: SubscriptionTier = 'free';
      if (subscription.items.data[0].price.id === process.env.STRIPE_PRO_PRICE_ID) {
        tier = 'pro';
      } else if (subscription.items.data[0].price.id === process.env.STRIPE_PREMIUM_PRICE_ID) {
        tier = 'premium';
      }

      await updateUser(user.id, {
        subscriptionTier: tier,
        subscriptionStatus: subscription.status as any,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const user = await getUserByStripeCustomerId(subscription.customer as string);

      await updateUser(user.id, {
        subscriptionTier: 'free',
        subscriptionStatus: 'canceled',
      });
      break;
    }
  }

  return { statusCode: 200, body: 'Success' };
};
```

---

## Consequences

### Positive

✅ **Clear value ladder** - Each tier provides obvious incremental value
✅ **High margins** - 90%+ gross margin across all tiers
✅ **Viral growth** - Free tier watermark drives brand awareness
✅ **Predictable revenue** - Monthly recurring model with Stripe
✅ **Low support burden** - Self-service tiers, priority support only for Premium
✅ **Scalable costs** - Infrastructure cost grows linearly with usage

### Negative

❌ **Quota management complexity** - Need accurate monthly reset logic
❌ **Stripe dependency** - Critical path dependency on third-party service
❌ **Churn risk** - Pro users may feel 20 posters/month is limiting
❌ **Watermark bypass** - Users might screenshot and crop watermark
❌ **Gym pricing** - May need team/enterprise tier for larger organizations

### Neutral

⚠️ **Competitive pricing** - $9.99 is standard but market may shift
⚠️ **Resolution limits** - May need adjustment based on user feedback
⚠️ **Tier naming** - "Pro" and "Premium" may be confusing, consider alternatives

---

## Cost Analysis

### Infrastructure Cost per 1000 Users

| Tier | Users | Posters/mo | Lambda Cost | S3 Cost | Bedrock Cost | Total Cost |
|------|-------|------------|-------------|---------|--------------|------------|
| Free | 800 | 1,600 | $3.20 | $2 | $0 | $5.20 |
| Pro | 150 | 3,000 | $6.00 | $5 | $0 | $11.00 |
| Premium | 50 | 5,000 | $10.00 | $10 | $100 | $120.00 |
| **Total** | **1,000** | **9,600** | **$19.20** | **$17** | **$100** | **$136.20** |

**Revenue:**
- Pro: 150 × $9.99 = $1,498.50
- Premium: 50 × $29.99 = $1,499.50
- **Total MRR: $2,998.00**

**Gross Margin: 95.5%**

---

## Future Considerations

### When to Adjust Pricing?

1. **Market research** - Conduct pricing surveys after 500 users
2. **Competitive pressure** - If competitors undercut significantly
3. **Cost changes** - If AWS/Bedrock pricing increases materially
4. **Feature expansion** - New features may justify price increases

### Enterprise/Team Tier?

Consider adding when:
- 3+ gyms request team features
- User feedback indicates "gym owner" use case
- Can support multi-seat licensing in infrastructure

**Potential Team Tier:**
- $99/month for 10 users
- Shared template library
- Team branding (gym logo)
- Admin dashboard

### Annual Pricing?

Offer annual plans with discount:
- Pro: $99/year (2 months free) vs $119.88 monthly
- Premium: $299/year (2 months free) vs $359.88 monthly

Benefits:
- Improved cash flow
- Lower churn (annual commitment)
- Reduced Stripe fees (fewer transactions)

---

## References

- [Stripe Subscription Best Practices](https://stripe.com/docs/billing/subscriptions/overview)
- [SaaS Pricing Strategies](https://www.priceintelligently.com/hubfs/Price-Intelligently-SaaS-Pricing-Strategy.pdf)
- [Competitive Pricing Analysis Spreadsheet](https://docs.google.com/spreadsheets/d/...)

---

## Review History

| Date | Reviewer | Status | Notes |
|------|----------|--------|-------|
| 2025-01-05 | Team | Accepted | Free/Pro/Premium tiers at $0/$9.99/$29.99 |
