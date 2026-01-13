# Accessibility & Performance Audit Design

**Issue:** ODE-83 - UI-POL-003: Accessibility & Performance Audit
**Date:** 2026-01-12
**Scope:** Critical issues only (WCAG AA blockers, key performance fixes)

## Current State Analysis

### Good Practices Already in Place

- `lang="en"` set on HTML element
- Focus ring styles defined (`.focus-ring` class, `focus-visible` styles on buttons)
- `aria-label` attributes on icon-only buttons (MobileNav, FloatingPreviewButton)
- `aria-labelledby` on sections with headings
- `role="alert"` for error messages
- `sr-only` classes for screen reader content
- Dialog accessibility (DialogTitle, DialogDescription)
- Font `display: 'swap'` for font loading
- Hero images have `priority` for LCP optimization
- Template cards have conditional `priority` based on position

### Gaps Identified

**Accessibility:**
1. Missing skip-to-content link
2. User menu button lacks `aria-label`
3. Back link in header lacks `aria-label` (icon-only on mobile)
4. Missing `aria-live` regions for dynamic loading states
5. Decorative icons missing `aria-hidden="true"`

**Performance:**
1. No explicit font preconnect hints
2. Template loading states could cause minor CLS

## Design

### 1. Accessibility Fixes

#### 1.1 Skip-to-Content Link

Add a skip link component that appears on focus, allowing keyboard users to bypass navigation.

**File:** `app/layout.tsx`

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold-500 focus:text-surface-950 focus:rounded-lg focus:outline-none"
>
  Skip to main content
</a>
```

Add `id="main-content"` to main content areas:
- `app/page.tsx` - Landing page main element
- `app/builder/page.tsx` - Builder page container
- `app/dashboard/page.tsx` - Dashboard main element

#### 1.2 Missing ARIA Labels

| File | Element | Fix |
|------|---------|-----|
| `components/builder/user-menu.tsx` | Trigger button | Add `aria-label="User menu"` |
| `components/builder/builder-header.tsx` | Back link | Add `aria-label="Go back to home"` |
| `app/page.tsx` | Decorative icons in features | Add `aria-hidden="true"` |

#### 1.3 Aria-Live Regions

**File:** `components/builder/photo-upload/upload-dropzone.tsx`

Wrap loading state content with `aria-live="polite"` to announce status changes to screen readers.

### 2. Performance Fixes

#### 2.1 Font Preconnect

**File:** `app/layout.tsx`

Next.js Google Fonts optimization already handles preloading. The current implementation with `display: 'swap'` is optimal. No changes needed.

#### 2.2 CLS Prevention

The existing `TemplateSkeleton` component provides layout stability during template loading. Verify it's being used in the template grid loading state.

### 3. Out of Scope

The following items are deferred for a future comprehensive audit:
- Lighthouse CI integration
- Full color contrast audit (4.5:1 ratio verification)
- Bundle size analysis and code splitting
- List virtualization for dashboard poster grid
- Comprehensive screen reader testing (NVDA/VoiceOver)

## Testing Strategy

### Automated Tests
- Unit test for skip-link focus visibility
- Verify ARIA attributes in existing component tests

### Manual Verification
- [ ] Tab through entire app - all interactive elements reachable
- [ ] Skip link appears on first Tab press
- [ ] Screen reader announces button purposes correctly
- [ ] No console accessibility warnings

## Files to Modify

1. `apps/web/app/layout.tsx` - Skip link
2. `apps/web/app/page.tsx` - Main content ID, decorative icon fixes
3. `apps/web/app/builder/page.tsx` - Main content ID
4. `apps/web/app/dashboard/page.tsx` - Main content ID
5. `apps/web/components/builder/user-menu.tsx` - ARIA label
6. `apps/web/components/builder/builder-header.tsx` - ARIA label
7. `apps/web/components/builder/photo-upload/upload-dropzone.tsx` - Aria-live region
