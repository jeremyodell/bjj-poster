# BJJ Poster Builder UI/UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first Next.js 14 web application for BJJ athletes to create tournament posters in <5 minutes with minimal friction and maximum conversion

**Architecture:** Next.js 14 App Router with Tailwind CSS + shadcn/ui component library, Zustand for global state (builder, user, quota), TanStack Query for server state (templates, posters, user data), progressive enhancement for core flows

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, Vitest, Playwright

---

## Epic Breakdown

This implementation is organized into 7 epics, each containing 3-6 stories sized for 1-3 day implementation by a developer with Claude Code assistance.

### Epic Summary

| Epic ID | Epic Name | Stories | Est. Points | Dependencies |
|---------|-----------|---------|-------------|--------------|
| **UI-FND** | Foundation & Design System | 4 | 13 | None |
| **UI-LND** | Landing & Marketing Pages | 3 | 8 | UI-FND |
| **UI-BLD** | Poster Builder Core | 6 | 18 | UI-FND |
| **UI-DSH** | Dashboard & Poster Management | 4 | 12 | UI-FND, UI-BLD |
| **UI-SUB** | Subscription & Upgrade Flow | 3 | 9 | UI-FND |
| **UI-ONB** | Onboarding & First-Time UX | 3 | 8 | UI-FND, UI-BLD |
| **UI-POL** | Polish & Performance | 3 | 10 | All |

**Total:** 26 stories, 78 estimated points

---

## Epic UI-FND: Foundation & Design System

**Goal:** Set up Next.js 14 project with Tailwind, shadcn/ui, and core design system tokens

**Dependencies:** None (starting point)

### Story UI-FND-001: Next.js 14 Project Scaffolding

**Points:** 3
**Type:** Setup
**Depends On:** None

#### Description

As a developer, I need a Next.js 14 App Router project with TypeScript, ESLint, and Tailwind CSS configured so that the team has a consistent development environment.

#### Acceptance Criteria

- [ ] Next.js 14 installed with App Router
- [ ] TypeScript configured with strict mode
- [ ] Tailwind CSS v3 installed and configured
- [ ] ESLint with Next.js config
- [ ] Prettier configured for code formatting
- [ ] Project builds and dev server runs
- [ ] `.gitignore` properly configured
- [ ] README updated with setup instructions

#### Files to Create/Modify

**Create:**
- `apps/web/` - Next.js app directory
- `apps/web/app/layout.tsx` - Root layout
- `apps/web/app/page.tsx` - Home page placeholder
- `apps/web/tailwind.config.js` - Tailwind configuration
- `apps/web/tsconfig.json` - TypeScript configuration
- `apps/web/.eslintrc.json` - ESLint configuration
- `apps/web/.prettierrc` - Prettier configuration

#### Implementation Steps

**Step 1: Initialize Next.js 14 app**

```bash
cd apps
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir
cd web
```

**Step 2: Configure TypeScript strict mode**

Edit `apps/web/tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Step 3: Configure Tailwind with custom tokens**

Edit `apps/web/tailwind.config.js`:
```js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#1a1f3a',
          700: '#2d3561',
          500: '#4361ee',
          300: '#7c8fd9',
          100: '#d4ddf7',
        },
        accent: {
          600: '#d4af37',
          500: '#ffd700',
          400: '#ffe55c',
        },
      },
      fontFamily: {
        display: ['Archivo Black', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

**Step 4: Add Google Fonts**

Edit `apps/web/app/layout.tsx`:
```tsx
import { Archivo_Black, DM_Sans, JetBrains_Mono } from 'next/font/google'

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetBrainsMono = JetBrains_Mono({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivoBlack.variable} ${dmSans.variable} ${jetBrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

**Step 5: Verify build**

```bash
pnpm build
pnpm dev
```

Expected: Dev server runs on localhost:3000, page loads successfully

**Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat(ui): initialize Next.js 14 app with Tailwind and design tokens"
```

---

### Story UI-FND-002: shadcn/ui Component Library Setup

**Points:** 3
**Type:** Setup
**Depends On:** UI-FND-001

#### Description

As a developer, I need shadcn/ui components installed and configured so that we have a consistent, accessible component library for building the UI.

#### Acceptance Criteria

- [ ] shadcn/ui initialized in project
- [ ] Core components installed (Button, Card, Input, Select, Textarea, Dialog, Sheet, Tooltip)
- [ ] Components styled with design system colors
- [ ] Component library documented in Storybook (optional) or example page
- [ ] All components render correctly

#### Files to Create/Modify

**Create:**
- `apps/web/components/ui/` - shadcn/ui components directory
- `apps/web/lib/utils.ts` - Utility functions (cn helper)
- `apps/web/app/components-demo/page.tsx` - Component demo page

#### Implementation Steps

**Step 1: Initialize shadcn/ui**

```bash
cd apps/web
npx shadcn-ui@latest init
```

Answer prompts:
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Step 2: Install core components**

```bash
npx shadcn-ui@latest add button card input select textarea dialog sheet tooltip dropdown-menu avatar badge
```

**Step 3: Create demo page**

Create `apps/web/app/components-demo/page.tsx`:
```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function ComponentsDemo() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="font-display text-4xl">Component Library</h1>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex gap-4">
          <Button variant="default">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Inputs</h2>
        <Input placeholder="Athlete name" />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>
        <Card className="p-6">
          <p>This is a card component</p>
        </Card>
      </section>
    </div>
  )
}
```

**Step 4: Verify components render**

```bash
pnpm dev
```

Navigate to `localhost:3000/components-demo`
Expected: All components render with correct styling

**Step 5: Commit**

```bash
git add .
git commit -m "feat(ui): add shadcn/ui component library"
```

---

### Story UI-FND-003: Zustand Store Setup

**Points:** 3
**Type:** Feature
**Depends On:** UI-FND-001

#### Description

As a developer, I need Zustand stores configured for poster builder state, user session, and quota tracking so that global state is managed consistently across the app.

#### Acceptance Criteria

- [ ] Zustand installed
- [ ] `usePosterBuilderStore` created with form state
- [ ] `useUserStore` created with user session and quota
- [ ] Stores have TypeScript interfaces
- [ ] DevTools enabled for debugging
- [ ] Unit tests for store actions
- [ ] LocalStorage persistence for builder drafts

#### Files to Create/Modify

**Create:**
- `apps/web/lib/stores/poster-builder-store.ts` - Builder state
- `apps/web/lib/stores/user-store.ts` - User session state
- `apps/web/lib/stores/__tests__/poster-builder-store.test.ts` - Tests

#### Implementation Steps

**Step 1: Install Zustand**

```bash
cd apps/web
pnpm add zustand
```

**Step 2: Write failing test for poster builder store**

Create `apps/web/lib/stores/__tests__/poster-builder-store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { usePosterBuilderStore } from '../poster-builder-store'

describe('PosterBuilderStore', () => {
  beforeEach(() => {
    usePosterBuilderStore.getState().reset()
  })

  it('should set athlete name', () => {
    const { setField } = usePosterBuilderStore.getState()
    setField('athleteName', 'João Silva')

    expect(usePosterBuilderStore.getState().athleteName).toBe('João Silva')
  })

  it('should reset form', () => {
    const store = usePosterBuilderStore.getState()
    store.setField('athleteName', 'João Silva')
    store.setField('beltRank', 'Black Belt')
    store.reset()

    expect(usePosterBuilderStore.getState().athleteName).toBe('')
    expect(usePosterBuilderStore.getState().beltRank).toBe('')
  })
})
```

**Step 3: Run test to verify it fails**

```bash
pnpm test lib/stores/__tests__/poster-builder-store.test.ts
```

Expected: FAIL with "module not found"

**Step 4: Implement poster builder store**

Create `apps/web/lib/stores/poster-builder-store.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PosterBuilderState {
  // Form data
  athletePhoto: File | null
  athleteName: string
  beltRank: string
  team: string
  tournament: string
  date: string
  location: string

  // Template selection
  selectedTemplateId: string | null

  // UI state
  isGenerating: boolean
  generationProgress: number
  showAdvancedOptions: boolean
  showPreview: boolean

  // Actions
  setPhoto: (file: File | null) => void
  setField: (field: string, value: string) => void
  setTemplate: (templateId: string) => void
  setGenerating: (isGenerating: boolean, progress?: number) => void
  toggleAdvancedOptions: () => void
  togglePreview: () => void
  reset: () => void
}

const initialState = {
  athletePhoto: null,
  athleteName: '',
  beltRank: '',
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
}

export const usePosterBuilderStore = create<PosterBuilderState>()(
  persist(
    (set) => ({
      ...initialState,

      setPhoto: (file) => set({ athletePhoto: file }),

      setField: (field, value) => set({ [field]: value }),

      setTemplate: (templateId) => set({ selectedTemplateId: templateId }),

      setGenerating: (isGenerating, progress = 0) =>
        set({ isGenerating, generationProgress: progress }),

      toggleAdvancedOptions: () =>
        set((state) => ({ showAdvancedOptions: !state.showAdvancedOptions })),

      togglePreview: () =>
        set((state) => ({ showPreview: !state.showPreview })),

      reset: () => set(initialState),
    }),
    {
      name: 'poster-builder-draft',
      partialize: (state) => ({
        athleteName: state.athleteName,
        beltRank: state.beltRank,
        team: state.team,
        tournament: state.tournament,
        date: state.date,
        location: state.location,
        selectedTemplateId: state.selectedTemplateId,
      }),
    }
  )
)
```

**Step 5: Run test to verify it passes**

```bash
pnpm test lib/stores/__tests__/poster-builder-store.test.ts
```

Expected: PASS

**Step 6: Implement user store**

Create `apps/web/lib/stores/user-store.ts`:
```typescript
import { create } from 'zustand'

export type SubscriptionTier = 'free' | 'pro' | 'premium'

export interface User {
  id: string
  email: string
  subscriptionTier: SubscriptionTier
  postersThisMonth: number
  postersLimit: number
}

export interface UserState {
  user: User | null
  isLoading: boolean

  setUser: (user: User | null) => void
  canCreatePoster: () => boolean
  incrementUsage: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  canCreatePoster: () => {
    const { user } = get()
    if (!user) return false
    if (user.subscriptionTier === 'premium') return true
    return user.postersThisMonth < user.postersLimit
  },

  incrementUsage: () =>
    set((state) => ({
      user: state.user
        ? { ...state.user, postersThisMonth: state.user.postersThisMonth + 1 }
        : null,
    })),
}))
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat(ui): add Zustand stores for builder and user state"
```

---

### Story UI-FND-004: TanStack Query Setup

**Points:** 4
**Type:** Setup
**Depends On:** UI-FND-001

#### Description

As a developer, I need TanStack Query configured for server state management so that we can efficiently fetch and cache templates, user data, and poster history.

#### Acceptance Criteria

- [ ] TanStack Query installed
- [ ] QueryClient configured with sensible defaults
- [ ] Query provider wrapping app
- [ ] DevTools enabled
- [ ] Mock API hooks created (useTemplates, usePosterHistory)
- [ ] Loading and error states handled
- [ ] Unit tests for custom hooks

#### Files to Create/Modify

**Create:**
- `apps/web/lib/query-client.ts` - QueryClient configuration
- `apps/web/lib/hooks/use-templates.ts` - Templates query hook
- `apps/web/lib/hooks/use-poster-history.ts` - Poster history hook
- `apps/web/lib/hooks/__tests__/use-templates.test.ts` - Tests
- `apps/web/app/providers.tsx` - Query provider wrapper

**Modify:**
- `apps/web/app/layout.tsx` - Wrap with providers

#### Implementation Steps

**Step 1: Install TanStack Query**

```bash
cd apps/web
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

**Step 2: Configure QueryClient**

Create `apps/web/lib/query-client.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

**Step 3: Create providers wrapper**

Create `apps/web/app/providers.tsx`:
```typescript
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**Step 4: Wrap app with providers**

Modify `apps/web/app/layout.tsx`:
```typescript
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**Step 5: Create useTemplates hook**

Create `apps/web/lib/hooks/use-templates.ts`:
```typescript
import { useQuery } from '@tanstack/react-query'

export interface Template {
  id: string
  name: string
  category: string
  thumbnailUrl: string
}

async function fetchTemplates(): Promise<Template[]> {
  // TODO: Replace with actual API call
  const response = await fetch('/api/templates')
  if (!response.ok) throw new Error('Failed to fetch templates')
  return response.json()
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })
}
```

**Step 6: Verify build**

```bash
pnpm build
```

Expected: Build succeeds

**Step 7: Commit**

```bash
git add .
git commit -m "feat(ui): add TanStack Query for server state management"
```

---

## Epic UI-LND: Landing & Marketing Pages

**Goal:** Create landing page, pricing page, and authentication flows

**Dependencies:** UI-FND (foundation must be complete)

### Story UI-LND-001: Landing Page Hero & CTA

**Points:** 3
**Type:** Feature
**Depends On:** UI-FND-002

#### Description

As a potential user, I need an engaging landing page that explains the product value and encourages signup so that I understand what the product does and am motivated to try it.

#### Acceptance Criteria

- [ ] Hero section with headline, subheadline, CTA
- [ ] 3 example poster images displayed
- [ ] "How It Works" 3-step section
- [ ] Mobile-responsive layout
- [ ] Accessible (ARIA labels, semantic HTML)
- [ ] Fast LCP (<2.5s)

#### Files to Create/Modify

**Create:**
- `apps/web/app/page.tsx` - Landing page
- `apps/web/components/landing/hero.tsx` - Hero component
- `apps/web/components/landing/how-it-works.tsx` - Steps component
- `apps/web/public/examples/` - Example poster images

#### Implementation (abbreviated for brevity)

Create hero component with proper semantic HTML, accessibility, and responsive design. Include CTA button linking to signup. Add example posters and "How It Works" section.

---

### Story UI-LND-002: Pricing Page

**Points:** 3
**Type:** Feature
**Depends On:** UI-FND-002

#### Description

As a potential user, I need a clear pricing page comparing Free, Pro, and Premium tiers so that I understand what features are available at each level.

#### Acceptance Criteria

- [ ] Three-column comparison table (Free, Pro, Premium)
- [ ] Monthly/annual toggle
- [ ] Feature list with checkmarks/X marks
- [ ] Clear CTAs for each tier
- [ ] Mobile-responsive (stacked cards on mobile)
- [ ] Accessible comparison table

#### Files to Create/Modify

**Create:**
- `apps/web/app/pricing/page.tsx` - Pricing page
- `apps/web/components/pricing/pricing-table.tsx` - Comparison table
- `apps/web/components/pricing/pricing-card.tsx` - Individual tier card

---

### Story UI-LND-003: Auth Pages (Signup/Login)

**Points:** 2
**Type:** Feature
**Depends On:** UI-FND-002

#### Description

As a user, I need signup and login pages so that I can create an account and access the poster builder.

#### Acceptance Criteria

- [ ] Signup form (email, password)
- [ ] Login form (email, password)
- [ ] Form validation with error messages
- [ ] Password visibility toggle
- [ ] "Forgot password" link
- [ ] Mobile-friendly forms
- [ ] Loading states on submit

#### Files to Create/Modify

**Create:**
- `apps/web/app/auth/signup/page.tsx` - Signup page
- `apps/web/app/auth/login/page.tsx` - Login page
- `apps/web/components/auth/auth-form.tsx` - Reusable auth form
- `apps/web/lib/validations/auth.ts` - Zod validation schemas

---

## Epic UI-BLD: Poster Builder Core

**Goal:** Build the main poster builder interface with all form fields, template selection, and photo upload

**Dependencies:** UI-FND

### Story UI-BLD-001: Builder Layout & Header

**Points:** 2
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-003

#### Description

As a user, I need a builder layout with header (logo, quota badge, user menu) so that I can navigate and see my usage.

#### Acceptance Criteria

- [ ] Builder layout component
- [ ] Header with logo, quota display, user menu
- [ ] Responsive header (hamburger on mobile)
- [ ] Quota badge shows "X of Y used"
- [ ] User menu dropdown (settings, logout)
- [ ] Header is sticky on scroll

---

### Story UI-BLD-002: Photo Upload Zone

**Points:** 4
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-003

#### Description

As a user, I need to upload my athlete photo via camera or file picker so that it can be used in my poster.

#### Acceptance Criteria

- [ ] Photo upload zone with drag-and-drop
- [ ] "Take Photo" button (opens camera on mobile)
- [ ] "Choose from Library" button (file picker)
- [ ] Image preview after upload
- [ ] Crop tool (basic rectangle crop)
- [ ] File validation (format, size)
- [ ] Error handling (file too large, invalid format)
- [ ] Loading state during upload

---

### Story UI-BLD-003: Template Selector

**Points:** 4
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-004

#### Description

As a user, I need to select a poster template from recommended options or browse all templates so that I can choose a style I like.

#### Acceptance Criteria

- [ ] "Recommended for you" section (3 templates)
- [ ] Expandable "Browse all" section
- [ ] Template grid (responsive: 1 col mobile, 2-3 desktop)
- [ ] Template thumbnails load from API
- [ ] Selected template highlighted
- [ ] Template categories/filters
- [ ] Loading state while fetching templates
- [ ] Error state if templates fail to load

---

### Story UI-BLD-004: Athlete Info Form Fields

**Points:** 3
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-003

#### Description

As a user, I need form fields for athlete name, belt rank, and team so that my poster displays correct information.

#### Acceptance Criteria

- [ ] Athlete name input (text)
- [ ] Belt rank select (dropdown with belt colors)
- [ ] Team input (text, optional)
- [ ] Real-time validation
- [ ] Error messages inline
- [ ] Fields auto-save to Zustand store
- [ ] Fields restore from localStorage on mount

---

### Story UI-BLD-005: Tournament Info & Advanced Fields

**Points:** 3
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-003, UI-BLD-004

#### Description

As a user, I need tournament name, date, location fields with optional "advanced" section so that I can add details without clutter.

#### Acceptance Criteria

- [ ] Tournament name input (always visible)
- [ ] Date picker input (optional)
- [ ] Location input (optional)
- [ ] "Add more details" expander button
- [ ] Advanced section collapsible
- [ ] Fields auto-save to store

---

### Story UI-BLD-006: Generate Button & Preview Modal

**Points:** 2
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-003

#### Description

As a user, I need a "Generate Poster" button and preview modal so that I can see my poster before generating.

#### Acceptance Criteria

- [ ] Generate button (sticky bottom on mobile)
- [ ] Button disabled if required fields missing
- [ ] Floating "Preview" button with thumbnail badge
- [ ] Preview modal (full-screen on mobile)
- [ ] Preview shows live-updated poster mockup
- [ ] Modal dismissible (swipe down on mobile, ESC key)
- [ ] Generate triggers poster creation API call

---

## Epic UI-DSH: Dashboard & Poster Management

**Goal:** Build dashboard for viewing poster history, downloading, sharing

**Dependencies:** UI-FND, UI-BLD

### Story UI-DSH-001: Dashboard Layout & Header

**Points:** 2
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-003

#### Description

As a user, I need a dashboard with welcome header and "Create New" CTA so that I can easily start creating posters.

---

### Story UI-DSH-002: Usage Card & Quota Display

**Points:** 2
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-003

#### Description

As a free user, I need to see my usage (X of Y posters used) with upgrade CTA so that I'm aware of my quota.

---

### Story UI-DSH-003: Poster Grid & Cards

**Points:** 4
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-004

#### Description

As a user, I need a grid of my created posters with actions (download, share, duplicate) so that I can manage my posters.

---

### Story UI-DSH-004: Filter, Sort, Empty States

**Points:** 4
**Type:** Feature
**Depends On:** UI-DSH-003

#### Description

As a user, I need to filter/sort posters and see helpful empty states so that I can find posters easily.

---

## Epic UI-SUB: Subscription & Upgrade Flow

**Goal:** Build upgrade prompts, modals, and Stripe Checkout integration

**Dependencies:** UI-FND

### Story UI-SUB-001: Upgrade Prompt Component

**Points:** 3
**Type:** Feature
**Depends On:** UI-FND-002

#### Description

As a developer, I need a reusable UpgradePrompt component so that we can show consistent upgrade CTAs throughout the app.

---

### Story UI-SUB-002: Quota Limit Modal

**Points:** 3
**Type:** Feature
**Depends On:** UI-FND-002, UI-FND-003, UI-SUB-001

#### Description

As a free user who hit the quota limit, I need a friendly modal showing my posters and upgrade benefits so that I'm motivated to upgrade.

---

### Story UI-SUB-003: Stripe Checkout Integration

**Points:** 3
**Type:** Feature
**Depends On:** UI-LND-002, UI-SUB-002

#### Description

As a user, I need to upgrade via Stripe Checkout so that I can access Pro/Premium features.

---

## Epic UI-ONB: Onboarding & First-Time UX

**Goal:** Create quick start wizard and first-time user experience

**Dependencies:** UI-FND, UI-BLD

### Story UI-ONB-001: Welcome Splash Screen

**Points:** 2
**Type:** Feature
**Depends On:** UI-FND-002

#### Description

As a first-time user, I need a welcome screen explaining the product and showing example posters so that I understand the value.

---

### Story UI-ONB-002: Guided Tooltips in Builder

**Points:** 3
**Type:** Feature
**Depends On:** UI-BLD (all)

#### Description

As a first-time user, I need inline tooltips guiding me through the builder so that I understand how to create my first poster.

---

### Story UI-ONB-003: First Poster Celebration

**Points:** 3
**Type:** Feature
**Depends On:** UI-BLD-006, UI-DSH-001

#### Description

As a first-time user who completed their first poster, I need a celebration screen so that I feel accomplished and motivated to create more.

---

## Epic UI-POL: Polish & Performance

**Goal:** Loading states, error handling, accessibility, performance optimization

**Dependencies:** All previous epics

### Story UI-POL-001: Loading States & Animations

**Points:** 4
**Type:** Feature
**Depends On:** UI-BLD-006

#### Description

As a user, I need engaging loading states during poster generation so that the wait feels shorter and I'm educated about features.

---

### Story UI-POL-002: Error Handling & Edge Cases

**Points:** 3
**Type:** Feature
**Depends On:** All UI-BLD, UI-DSH

#### Description

As a developer, I need comprehensive error handling for network failures, validation errors, and edge cases so that users see helpful error messages.

---

### Story UI-POL-003: Accessibility & Performance Audit

**Points:** 3
**Type:** Task
**Depends On:** All

#### Description

As a developer, I need to audit and fix accessibility issues and performance bottlenecks so that the app meets WCAG 2.1 AA and Core Web Vitals.

---

## Implementation Order

**Phase 1: Foundation (Week 1)**
- UI-FND-001 → UI-FND-002 → UI-FND-003 → UI-FND-004

**Phase 2: Landing & Auth (Week 1-2)**
- UI-LND-001 → UI-LND-002 → UI-LND-003

**Phase 3: Builder Core (Week 2-3)**
- UI-BLD-001 → UI-BLD-002 → UI-BLD-003 → UI-BLD-004 → UI-BLD-005 → UI-BLD-006

**Phase 4: Dashboard (Week 3-4)**
- UI-DSH-001 → UI-DSH-002 → UI-DSH-003 → UI-DSH-004

**Phase 5: Subscriptions (Week 4)**
- UI-SUB-001 → UI-SUB-002 → UI-SUB-003

**Phase 6: Onboarding (Week 5)**
- UI-ONB-001 → UI-ONB-002 → UI-ONB-003

**Phase 7: Polish (Week 5-6)**
- UI-POL-001 → UI-POL-002 → UI-POL-003

---

## Testing Strategy

**Unit Tests:**
- Zustand store actions
- Form validation logic
- Utility functions

**Component Tests:**
- Form field behavior
- Button interactions
- Modal open/close
- Template selection

**E2E Tests (Playwright):**
- Complete poster creation flow
- Signup → Builder → Generate → Download
- Quota limit → Upgrade flow
- Mobile-specific interactions

---

## Success Criteria

- [ ] User can create poster in <5 minutes on mobile
- [ ] All pages achieve LCP <2.5s
- [ ] WCAG 2.1 AA compliance
- [ ] 90+ Lighthouse scores (Performance, Accessibility)
- [ ] Zero TypeScript errors in strict mode
- [ ] >80% test coverage on critical paths
