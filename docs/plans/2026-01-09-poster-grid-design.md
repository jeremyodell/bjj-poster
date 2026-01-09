# Poster Grid & Cards Design

**Issue:** ODE-73 - UI-DSH-003: Poster Grid & Cards
**Date:** 2026-01-09
**Status:** Approved

## Summary

Build a responsive grid of poster cards with thumbnails and actions (download, share, duplicate) for the dashboard.

## Decisions

| Aspect | Decision |
|--------|----------|
| Data Model | Extend existing `Poster` type with `athleteName`, `tournament`, `beltRank`, `status` |
| Grid Layout | 1 col (mobile) → 2 cols (tablet) → 3 cols (desktop), 24px gap |
| Card Structure | Thumbnail (3:4), title, subtitle, 3 action icon buttons |
| Actions | Download (blob download), Share (modal), Duplicate (to builder) |
| Share Modal | Copy link + Instagram + Facebook + Twitter/X |
| Loading State | 6 skeleton cards with pulse animation |
| Empty State | Icon + message + "Create Poster" button |
| Error State | Warning icon + message + "Try Again" button |
| Thumbnail Fallback | Dark surface with centered icon |

## Component Structure

```
apps/web/components/dashboard/
├── poster-grid/
│   ├── index.ts              # Barrel export
│   ├── poster-grid.tsx       # Main grid container
│   ├── poster-card.tsx       # Individual poster card
│   ├── poster-card-skeleton.tsx  # Loading skeleton
│   ├── poster-grid-empty.tsx # Empty state
│   ├── poster-grid-error.tsx # Error state with retry
│   └── share-modal.tsx       # Share dialog
└── __tests__/
    └── poster-grid.test.tsx  # Tests for all components
```

## Component Hierarchy

```
<PosterGrid>
  ├── Loading? → <PosterCardSkeleton /> × 6
  ├── Error? → <PosterGridError onRetry={refetch} />
  ├── Empty? → <PosterGridEmpty />
  └── Data? → <PosterCard /> × n
                └── <ShareModal /> (portal)
```

## Type Extension

In `lib/types/api.ts`:

```typescript
interface Poster {
  id: string;
  templateId: string;
  thumbnailUrl: string;
  title: string;
  athleteName: string;
  tournament: string;
  beltRank: string;
  status: 'draft' | 'completed';
  createdAt: string;
}
```

## PosterGrid Container

Responsive grid layout:

```typescript
<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  {posters.map((poster) => (
    <PosterCard key={poster.id} poster={poster} />
  ))}
</div>
```

Data fetching uses existing `usePosterHistory(userId)` hook.

## PosterCard Layout

```
┌─────────────────────────┐
│                         │
│      Thumbnail          │  ← 3:4 aspect ratio
│      (or placeholder)   │
│                         │
├─────────────────────────┤
│ Tournament Name      H3 │  ← Title (tournament)
│ Gold Belt • Jan 9, 2026 │  ← Subtitle (beltRank • date)
│                         │
│  [📥] [💬] [📋]         │  ← Action buttons with tooltips
└─────────────────────────┘
```

Styling matches existing Card patterns with gold accent on hover.

## Action Handlers

### Download
Fetches image as blob, creates download link, triggers browser download.

### Share
Opens ShareModal with 4 options:
- Copy Link (clipboard API)
- Instagram (link only, no direct share API)
- Facebook (`/sharer/sharer.php`)
- Twitter/X (`/intent/tweet`)

### Duplicate
Copies poster data to `usePosterBuilderStore` via new `loadFromPoster()` method, then navigates to `/builder`.

## Empty State

```
┌─────────────────────────────────────┐
│            📄 (icon)                │
│       No posters yet                │
│   Create your first tournament      │
│          poster!                    │
│      [ Create Poster ]              │
└─────────────────────────────────────┘
```

Centered layout with dashed border, button links to `/builder`.

## Error State

```
┌─────────────────────────────────────┐
│         ⚠️ (icon, amber)            │
│    Couldn't load posters            │
│   Something went wrong.             │
│         [ Try Again ]               │
└─────────────────────────────────────┘
```

Outline button calls `refetch()` from TanStack Query.

## Share Modal

```
┌─────────────────────────────────────┐
│  Share Poster                    ✕  │
├─────────────────────────────────────┤
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│   │ 🔗  │ │ 📷  │ │ 📘  │ │ 𝕏   │  │
│   │Copy │ │Insta│ │ FB  │ │ X   │  │
│   └─────┘ └─────┘ └─────┘ └─────┘  │
│   "Link copied!" (toast feedback)   │
└─────────────────────────────────────┘
```

Accessible modal with focus trap, escape to close, aria-labels.

## Files to Create

- `poster-grid.tsx` - Main container with data fetching
- `poster-card.tsx` - Individual card component
- `poster-card-skeleton.tsx` - Loading skeleton
- `poster-grid-empty.tsx` - Empty state
- `poster-grid-error.tsx` - Error state
- `share-modal.tsx` - Share dialog
- `poster-grid.test.tsx` - Tests

## Files to Modify

- `lib/types/api.ts` - Extend Poster type
- `lib/api/posters.ts` - Update mock data
- `lib/stores/poster-builder-store.ts` - Add `loadFromPoster()` method
- `components/dashboard/index.ts` - Export new components
