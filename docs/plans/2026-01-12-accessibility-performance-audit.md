# Accessibility & Performance Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical WCAG 2.1 AA accessibility issues including skip-to-content link, missing ARIA labels, and aria-live regions.

**Architecture:** Add a skip link component to the root layout, add `id="main-content"` to main content areas, and enhance existing components with proper ARIA attributes for screen reader support.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, Vitest

---

## Task 1: Add Skip-to-Content Link

**Files:**
- Modify: `apps/web/app/layout.tsx:30-45`
- Test: `apps/web/app/__tests__/layout.test.tsx` (create)

**Step 1: Write the failing test**

Create `apps/web/app/__tests__/layout.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Bebas_Neue: () => ({ variable: '--font-bebas-neue' }),
  Outfit: () => ({ variable: '--font-outfit' }),
  JetBrains_Mono: () => ({ variable: '--font-jetbrains-mono' }),
}));

// Mock Providers
vi.mock('../providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import RootLayout from '../layout';

describe('RootLayout', () => {
  it('renders skip-to-content link', () => {
    render(
      <RootLayout>
        <main id="main-content">Content</main>
      </RootLayout>
    );

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('skip link has correct focus styles', () => {
    render(
      <RootLayout>
        <main id="main-content">Content</main>
      </RootLayout>
    );

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toHaveClass('sr-only');
    expect(skipLink).toHaveClass('focus:not-sr-only');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test app/__tests__/layout.test.tsx`
Expected: FAIL - skip link not found

**Step 3: Write minimal implementation**

Modify `apps/web/app/layout.tsx` - add skip link after opening `<body>` tag:

```tsx
<body className="font-body antialiased min-h-screen bg-surface-950">
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold-500 focus:text-surface-950 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-surface-950"
  >
    Skip to main content
  </a>
  <Providers>{children}</Providers>
</body>
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test app/__tests__/layout.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/app/__tests__/layout.test.tsx
git commit -m "feat(a11y): add skip-to-content link in root layout"
```

---

## Task 2: Add Main Content ID to Landing Page

**Files:**
- Modify: `apps/web/app/page.tsx:9`
- Test: `apps/web/app/__tests__/page.test.tsx` (update existing)

**Step 1: Write the failing test**

Add to `apps/web/app/__tests__/page.test.tsx`:

```tsx
it('has main-content id for skip link target', () => {
  render(<Home />);
  const main = screen.getByRole('main');
  expect(main).toHaveAttribute('id', 'main-content');
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test app/__tests__/page.test.tsx`
Expected: FAIL - id attribute not found

**Step 3: Write minimal implementation**

Modify `apps/web/app/page.tsx` line 9 - add id to main element:

```tsx
<main id="main-content" className="min-h-screen bg-surface-950 overflow-hidden">
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test app/__tests__/page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/page.tsx apps/web/app/__tests__/page.test.tsx
git commit -m "feat(a11y): add main-content id to landing page"
```

---

## Task 3: Add Main Content ID to Builder Page

**Files:**
- Modify: `apps/web/app/builder/page.tsx:6`

**Step 1: Write minimal implementation**

Modify `apps/web/app/builder/page.tsx` line 6 - add id and role to container div:

```tsx
<main id="main-content" className="px-4 py-8 md:px-8 md:py-12">
```

Change `<div>` to `<main>` and add the id.

**Step 2: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/app/builder/page.tsx
git commit -m "feat(a11y): add main-content id to builder page"
```

---

## Task 4: Add Main Content ID to Dashboard Page

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx:10`
- Test: `apps/web/app/dashboard/__tests__/page.test.tsx` (update existing)

**Step 1: Write the failing test**

Add to `apps/web/app/dashboard/__tests__/page.test.tsx`:

```tsx
it('has main-content id for skip link target', () => {
  render(<DashboardPage />);
  const main = screen.getByRole('main');
  expect(main).toHaveAttribute('id', 'main-content');
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test app/dashboard/__tests__/page.test.tsx`
Expected: FAIL - id attribute not found

**Step 3: Write minimal implementation**

Modify `apps/web/app/dashboard/page.tsx` line 10 - add id:

```tsx
<main id="main-content" className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test app/dashboard/__tests__/page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/dashboard/page.tsx apps/web/app/dashboard/__tests__/page.test.tsx
git commit -m "feat(a11y): add main-content id to dashboard page"
```

---

## Task 5: Add ARIA Label to User Menu Button

**Files:**
- Modify: `apps/web/components/builder/user-menu.tsx:38-43`
- Test: `apps/web/components/builder/__tests__/user-menu.test.tsx` (update existing)

**Step 1: Write the failing test**

Add to `apps/web/components/builder/__tests__/user-menu.test.tsx`:

```tsx
it('has accessible aria-label on trigger button', () => {
  render(<UserMenu />);
  const button = screen.getByRole('button', { name: /user menu/i });
  expect(button).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test components/builder/__tests__/user-menu.test.tsx`
Expected: FAIL - no button with name "user menu"

**Step 3: Write minimal implementation**

Modify `apps/web/components/builder/user-menu.tsx` lines 38-43 - add aria-label:

```tsx
<button
  aria-label="User menu"
  className={cn(
    'flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-primary-900',
    className
  )}
>
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test components/builder/__tests__/user-menu.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/user-menu.tsx apps/web/components/builder/__tests__/user-menu.test.tsx
git commit -m "feat(a11y): add aria-label to user menu button"
```

---

## Task 6: Add ARIA Label to Back Link

**Files:**
- Modify: `apps/web/components/builder/builder-header.tsx:36-42`
- Test: `apps/web/components/builder/__tests__/builder-header.test.tsx` (update existing)

**Step 1: Write the failing test**

Add to `apps/web/components/builder/__tests__/builder-header.test.tsx`:

```tsx
it('has accessible aria-label on back link', () => {
  render(<BuilderHeader />);
  const backLink = screen.getByRole('link', { name: /go back to home/i });
  expect(backLink).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test components/builder/__tests__/builder-header.test.tsx`
Expected: FAIL - no link with name "go back to home"

**Step 3: Write minimal implementation**

Modify `apps/web/components/builder/builder-header.tsx` lines 36-42 - add aria-label:

```tsx
<Link
  href="/"
  aria-label="Go back to home"
  className="group flex items-center gap-2 text-surface-400 transition-colors hover:text-white"
>
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test components/builder/__tests__/builder-header.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/builder-header.tsx apps/web/components/builder/__tests__/builder-header.test.tsx
git commit -m "feat(a11y): add aria-label to back link in builder header"
```

---

## Task 7: Add Aria-Live to Upload Dropzone Loading State

**Files:**
- Modify: `apps/web/components/builder/photo-upload/upload-dropzone.tsx:87-99`
- Test: `apps/web/components/builder/photo-upload/__tests__/upload-dropzone.test.tsx` (update existing)

**Step 1: Write the failing test**

Add to `apps/web/components/builder/photo-upload/__tests__/upload-dropzone.test.tsx`:

```tsx
it('announces loading state to screen readers', () => {
  render(
    <UploadDropzone
      onFileSelect={vi.fn()}
      error={null}
      isLoading={true}
    />
  );

  const liveRegion = screen.getByRole('status');
  expect(liveRegion).toBeInTheDocument();
  expect(liveRegion).toHaveTextContent(/processing image/i);
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test components/builder/photo-upload/__tests__/upload-dropzone.test.tsx`
Expected: FAIL - no element with role "status"

**Step 3: Write minimal implementation**

Modify `apps/web/components/builder/photo-upload/upload-dropzone.tsx` lines 87-99 - wrap loading content with role="status":

```tsx
{isLoading ? (
  <div role="status" aria-live="polite" className="flex flex-col items-center">
    <div className="relative">
      <div className="absolute inset-0 animate-ping rounded-full bg-gold-500/20" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-surface-700 bg-surface-800">
        <Loader2
          data-testid="loading-spinner"
          className="h-8 w-8 animate-spin text-gold-500"
          aria-hidden="true"
        />
      </div>
    </div>
    <p className="mt-5 text-sm font-medium text-surface-300">Processing image...</p>
  </div>
) : (
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test components/builder/photo-upload/__tests__/upload-dropzone.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/photo-upload/upload-dropzone.tsx apps/web/components/builder/photo-upload/__tests__/upload-dropzone.test.tsx
git commit -m "feat(a11y): add aria-live region to upload dropzone loading state"
```

---

## Task 8: Add aria-hidden to Decorative Icons on Landing Page

**Files:**
- Modify: `apps/web/app/page.tsx` (multiple locations)

**Step 1: Write minimal implementation**

Modify `apps/web/app/page.tsx` - add `aria-hidden="true"` to decorative icons:

Line 33 (Trophy in logo):
```tsx
<Trophy className="h-5 w-5 text-surface-950" aria-hidden="true" />
```

Line 59 (Sparkles in badge):
```tsx
<Sparkles className="h-4 w-4 text-gold-500" aria-hidden="true" />
```

Line 87 (ArrowRight in CTA button):
```tsx
<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
```

Line 301-322 (Feature icons are already marked with `aria-hidden` - no change needed)

Line 318 (Feature.icon):
```tsx
<feature.icon className="h-5 w-5 text-gold-500" aria-hidden="true" />
```

Line 339 (Trophy placeholder):
```tsx
<Trophy className="h-32 w-32 text-surface-700" aria-hidden="true" />
```

Line 376 (ArrowRight in final CTA):
```tsx
<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
```

Line 392 (Trophy in footer):
```tsx
<Trophy className="h-4 w-4 text-surface-950" aria-hidden="true" />
```

**Step 2: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(a11y): add aria-hidden to decorative icons on landing page"
```

---

## Task 9: Run Full Test Suite and Verify

**Step 1: Run all tests**

Run: `cd apps/web && pnpm test`
Expected: All tests PASS

**Step 2: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: PASS

**Step 3: Run lint**

Run: `cd apps/web && pnpm lint`
Expected: PASS (or no new errors)

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Skip-to-content link | `layout.tsx`, `layout.test.tsx` |
| 2 | Landing page main-content id | `page.tsx`, `page.test.tsx` |
| 3 | Builder page main-content id | `builder/page.tsx` |
| 4 | Dashboard page main-content id | `dashboard/page.tsx`, `page.test.tsx` |
| 5 | User menu aria-label | `user-menu.tsx`, `user-menu.test.tsx` |
| 6 | Back link aria-label | `builder-header.tsx`, `builder-header.test.tsx` |
| 7 | Upload dropzone aria-live | `upload-dropzone.tsx`, `upload-dropzone.test.tsx` |
| 8 | Decorative icons aria-hidden | `page.tsx` |
| 9 | Full verification | All files |
