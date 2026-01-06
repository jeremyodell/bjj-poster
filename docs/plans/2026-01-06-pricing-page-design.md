# Pricing Page Design

## Overview

Build a pricing comparison page with Free/Pro/Premium tiers, monthly/annual toggle, and clear CTAs at `apps/web/app/pricing/page.tsx`.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Card-based (3 cards) | Matches landing page style, easier responsive handling |
| Toggle position | Centered above cards | Standard SaaS pattern, single control for all prices |
| Pro tier highlight | Gold border + badge + scale | Uses existing accent color, noticeable but not overwhelming |
| CTAs | Tier-specific text + styling | Clear intent, pre-selects plan in signup flow |

## Page Structure

```
┌─────────────────────────────────────────────────┐
│                   Header                         │
│         "Simple, Transparent Pricing"            │
│      "Choose the plan that fits your needs"      │
├─────────────────────────────────────────────────┤
│              [ Monthly | Annual ]                │
│                  Save 20% ↑                      │
├─────────────────────────────────────────────────┤
│   ┌─────────┐  ┌───────────┐  ┌─────────┐       │
│   │  FREE   │  │    PRO    │  │ PREMIUM │       │
│   │  $0/mo  │  │  ★ Most   │  │$29.99/mo│       │
│   │         │  │  Popular  │  │         │       │
│   │ Features│  │ $9.99/mo  │  │ Features│       │
│   │   ...   │  │  Features │  │   ...   │       │
│   │[Outline]│  │ [Primary] │  │ [Solid] │       │
│   └─────────┘  └───────────┘  └─────────┘       │
└─────────────────────────────────────────────────┘
```

## Pricing Tiers

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| **Price (Monthly)** | $0 | $9.99 | $29.99 |
| **Price (Annual)** | $0 | $7.99/mo | $23.99/mo |
| Posters per month | 2 | 20 | Unlimited |
| Export resolution | 720p | 1080p HD | 4K |
| Watermark | Yes | No | No |
| Background removal | No | Yes | Yes |
| AI backgrounds | No | No | Yes |
| Priority support | No | No | Yes |

### Annual Pricing
- 20% discount on monthly price
- Pro: $7.99/mo (billed $95.88/year)
- Premium: $23.99/mo (billed $287.88/year)

## Component Architecture

```
app/pricing/page.tsx
├── PricingHeader (heading + subheading)
├── BillingToggle (monthly/annual switch)
│   └── Button group with aria-radiogroup
└── PricingCards (grid container)
    └── PricingCard × 3
        ├── CardHeader (tier name, badge if popular)
        ├── CardPrice (price, billing period)
        ├── CardFeatures (feature list with icons)
        └── CardCTA (button)
```

### State Management
- Single `useState<'monthly' | 'annual'>` in page component
- Passed to cards to compute displayed price
- No external state library needed

## Accessibility

- Toggle: `role="radiogroup"` with `aria-label="Billing period"`
- Toggle options: `role="radio"` with `aria-checked`
- Price changes: `aria-live="polite"` region for announcements
- Feature icons: `aria-hidden="true"`, text provides meaning
- Cards: semantic structure with proper heading hierarchy
- "Most Popular" badge: accessible to screen readers

## Styling

### Colors (matching landing page)
- Page background: `bg-primary-900`
- Card backgrounds: `bg-primary-800`
- Pro card border: `border-2 border-accent-gold`
- Text: `text-white` (headings), `text-primary-300` (body)
- Badge: `bg-accent-gold/10 border-accent-gold text-accent-gold`

### Toggle
- Container: `bg-primary-800 rounded-full p-1`
- Active: `bg-primary-600 text-white`
- Inactive: `text-primary-300`
- "Save 20%" pill: gold accent

### Feature List
- Included: `text-white` with checkmark icon
- Excluded: `text-primary-400` with X/dash icon
- Spacing: `space-y-3`

### Buttons
- Free: `variant="outline"`
- Pro: `variant="default"` (primary action)
- Premium: `variant="default"`

### Spacing
- Section: `py-20 px-6 lg:px-8`
- Card gap: `gap-8`
- Max width: `max-w-7xl mx-auto`

## Responsive Behavior

- **Desktop (lg+)**: 3 columns, Pro card scaled 105%
- **Tablet (md)**: 3 columns, equal sizing
- **Mobile**: Single column, cards stacked, Pro card first (CSS order)

## CTAs

| Tier | Button Text | Link | Variant |
|------|-------------|------|---------|
| Free | Get Started Free | `/auth/signup?plan=free` | outline |
| Pro | Start Pro Trial | `/auth/signup?plan=pro` | default |
| Premium | Go Premium | `/auth/signup?plan=premium` | default |
