# Stripe Checkout Integration Design

**Issue:** ODE-77 - UI-SUB-003: Stripe Checkout Integration
**Date:** 2026-01-10
**Status:** Approved

## Overview

Integrate Stripe Checkout for Pro/Premium subscription upgrades using the redirect-to-hosted-checkout approach. Users click "Upgrade", get redirected to Stripe's hosted checkout page, and return to the dashboard on success or pricing page on cancel.

## Architecture

### Components

```
apps/api/src/handlers/payments/
├── create-checkout-session.ts   # Creates Stripe Checkout session
├── stripe-webhook.ts            # Handles Stripe webhook events
└── index.ts                     # Barrel export

apps/web/
├── lib/api/checkout.ts          # Frontend API client for checkout
├── components/checkout/
│   ├── checkout-button.tsx      # Triggers checkout flow
│   └── upgrade-success-handler.tsx  # Handles success redirect
└── app/providers.tsx            # Add Sonner Toaster
```

### Data Flow

1. User clicks "Upgrade to Pro" on pricing page
2. Frontend calls `POST /payments/checkout` with `{ tier, interval }`
3. Lambda creates Stripe Checkout session with:
   - `client_reference_id`: Cognito userId
   - `success_url`: `/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `/pricing?upgrade=cancelled`
   - `mode`: `subscription`
   - `line_items`: Price ID for selected tier/interval
4. Frontend receives `{ url }` and redirects to Stripe
5. User completes payment on Stripe
6. Stripe sends `checkout.session.completed` webhook
7. Webhook handler updates user's `subscriptionTier` in DynamoDB
8. User redirected to dashboard, sees success toast

## Backend Design

### Create Checkout Session Handler

**File:** `apps/api/src/handlers/payments/create-checkout-session.ts`
**Endpoint:** `POST /payments/checkout`
**Auth:** Required (Cognito)

**Request:**
```typescript
{
  tier: 'pro' | 'premium';
  interval: 'month' | 'year';
}
```

**Response:**
```typescript
{
  url: string;  // Stripe Checkout URL
}
```

**Implementation:**
1. Extract `userId` from Cognito authorizer claims
2. Validate request body with Zod schema
3. Map `{tier, interval}` to environment variable price ID
4. Create Stripe Checkout session
5. Return the session URL

**Error Handling:**
- Missing/invalid body → 400 ValidationError
- Invalid tier/interval combo → 400 ValidationError
- User not authenticated → 401 Unauthorized
- Stripe API failure → 500 with logged details

### Webhook Handler

**File:** `apps/api/src/handlers/payments/stripe-webhook.ts`
**Endpoint:** `POST /payments/webhook`
**Auth:** None (Stripe signature verification)

**Security:**
- Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
- Reject requests with invalid/missing signature (401)
- Use raw body for signature verification

**Events Handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Update user's `subscriptionTier` in DynamoDB |

**Implementation:**
1. Get raw body and `stripe-signature` header
2. Verify signature with `stripe.webhooks.constructEvent()`
3. If `checkout.session.completed`:
   - Extract `client_reference_id` (userId)
   - Determine tier from price ID (reverse lookup)
   - Update user in DynamoDB: `subscriptionTier = 'pro' | 'premium'`
4. Return 200 immediately

**Error Handling:**
- Invalid signature → 401 (logged as warning)
- Unknown event type → 200 (ignore gracefully)
- DB update failure → 500 (Stripe will retry)

### Environment Variables

```env
# Already exists
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# New - add these
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxx
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_xxx
STRIPE_PRICE_ID_PREMIUM_ANNUAL=price_xxx
```

### Local Server Updates

Update `apps/api/src/local-server.ts`:
- Add route for `/payments/checkout` → `createCheckoutSession` handler
- Add route for `/payments/webhook` → `stripeWebhook` handler
- Expose raw body for webhook signature verification (use `express.raw()` middleware for webhook route)

## Frontend Design

### API Client

**File:** `apps/web/lib/api/checkout.ts`

```typescript
interface CreateCheckoutParams {
  tier: 'pro' | 'premium';
  interval: 'month' | 'year';
}

interface CheckoutResponse {
  url: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<CheckoutResponse>
```

Uses existing `apiFetch` pattern with proper error handling.

### CheckoutButton Component

**File:** `apps/web/components/checkout/checkout-button.tsx`

**Props:**
- `tier: 'pro' | 'premium'`
- `interval: 'month' | 'year'`
- `children: React.ReactNode`
- `className?: string`

**Behavior:**
- Manages loading state during API call and redirect
- On click: calls API → shows loading spinner → redirects to Stripe URL
- On error: shows error toast via Sonner, stays on page

**Usage:**
```tsx
<CheckoutButton tier="pro" interval="month">
  Upgrade to Pro
</CheckoutButton>
```

### UpgradeSuccessHandler Component

**File:** `apps/web/components/checkout/upgrade-success-handler.tsx`

**Behavior:**
- Client component, rendered on dashboard
- Checks URL for `?upgrade=success` query param
- Shows celebration toast: "🎉 Welcome to Pro! Your upgrade is active."
- Clears the query param from URL (replaceState)
- Triggers user store refresh to get updated tier

### Cancel Handling

On `/pricing?upgrade=cancelled`:
- Show info toast: "Upgrade cancelled. You can try again anytime."
- Clear query param from URL

### Toast Setup (Sonner)

1. Install: `pnpm add sonner` in `apps/web`
2. Add `<Toaster />` to `apps/web/app/providers.tsx`
3. Configure: position top-right, theme integration

**Usage:**
```typescript
import { toast } from 'sonner';

toast.success('🎉 Welcome to Pro!');
toast.error('Something went wrong. Please try again.');
```

## Testing Strategy

### Unit Tests

| Component | Test Coverage |
|-----------|---------------|
| `create-checkout-session.ts` | Valid request creates session, invalid tier returns 400, missing auth returns 401, Stripe error handled gracefully |
| `stripe-webhook.ts` | Valid signature processes event, invalid signature returns 401, unknown event returns 200, updates user tier correctly |
| `CheckoutButton` | Shows loading state on click, redirects on success, shows error toast on failure |
| `UpgradeSuccessHandler` | Shows toast when success param present, clears URL param, refreshes user store |

### Mocking

- Mock Stripe SDK in unit tests
- Use Stripe CLI for local webhook testing:
  ```bash
  stripe listen --forward-to localhost:3001/payments/webhook
  ```

## Decisions Made

1. **Lambda handler over Next.js API route** - Consistent with existing architecture
2. **Redirect to Stripe-hosted Checkout** - Simplest, most secure approach
3. **client_reference_id for user linking** - No upfront Stripe Customer creation needed
4. **Sonner for toasts** - Lightweight, great DX, easy setup
5. **Webhook included in scope** - Completes the full upgrade flow
6. **Environment variables per price** - Clear, explicit configuration
