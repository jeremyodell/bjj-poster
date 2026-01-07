# Template Selector Design

**Issue:** ODE-67 - UI-BLD-003: Template Selector
**Date:** 2026-01-07
**Status:** Approved

## Overview

Build a template selector component with "Recommended for you" and expandable "Browse All" sections for the poster builder.

## Component Structure

```
components/builder/template-selector/
├── index.ts                    # exports
├── template-selector.tsx       # main orchestrator component
├── template-card.tsx           # individual template card
├── template-grid.tsx           # responsive grid layout
├── template-skeleton.tsx       # loading skeleton
└── __tests__/
    ├── template-selector.test.tsx
    ├── template-card.test.tsx
    └── template-grid.test.tsx
```

## Component Details

### TemplateSelector (Main Component)

- Uses `useTemplates()` hook to fetch template data
- Uses `usePosterBuilderStore` for selection state
- Renders "Recommended" section (first 3 templates)
- Renders collapsible "Browse All" section
- Handles loading/error states

### TemplateCard

```tsx
interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}
```

**Visual Design:**
- Card with thumbnail image (300×400px aspect ratio via `aspect-[3/4]`)
- Template name below image
- Selected state: blue border (`ring-2 ring-primary-500`) + checkmark icon overlay
- Hover state: subtle scale (`hover:scale-[1.02]`) + shadow lift
- Keyboard accessible: focus ring, Enter/Space to select

**Image Handling:**
- Next.js `<Image>` with `fill` + `object-cover`
- Fallback gradient background if image fails to load
- Alt text: template name

### TemplateGrid

Responsive grid component for displaying template cards.

### TemplateSkeleton

Loading placeholder matching TemplateCard dimensions with pulse animation.

## Layout & Responsiveness

### Recommended Section
- Heading: "Recommended for you"
- Horizontal scroll on mobile (flex with `overflow-x-auto`)
- Grid on desktop: 3 columns

### Browse All Section
- Collapsible with chevron icon
- Default state: collapsed
- Button text: "Browse all templates"
- Grid layout:
  - Mobile: 1 column
  - Tablet (md): 2 columns
  - Desktop (lg): 3 columns
- Gap: `gap-4`

### Category Filters
- Horizontal pill buttons inside Browse All
- Options: "All", plus categories derived from templates dynamically
- Filter applied client-side

## States

### Loading State
- Skeleton cards matching TemplateCard dimensions
- 3 skeletons in recommended section
- Pulse animation (`animate-pulse`)
- Gray background (`bg-gray-700`)

### Error State
- Error message: "Failed to load templates"
- Retry button calling `refetch()` from useTemplates
- Refresh icon

### Empty State
- Message: "No templates available"

## Data Flow

```
useTemplates() → templates data
usePosterBuilderStore() → selectedTemplateId, setTemplate()
```

**Selection Flow:**
1. User clicks TemplateCard
2. `onSelect(templateId)` called
3. `setTemplate(templateId)` updates Zustand store
4. Store persists to localStorage (already configured)
5. Card re-renders with `isSelected: true`

## Accessibility

- Cards are buttons with `role="radio"` in a `role="radiogroup"`
- Arrow key navigation between cards
- Visible focus indicators
- Semantic heading structure

## Integration

- TemplateSelector is self-contained
- Import and place in `app/builder/page.tsx`
- No props required - manages own data fetching

## Design Decisions

**Client-side Filtering for Recommended:**
- "Recommended" = first 3 templates from API response
- Simpler than extending API types
- Can be updated when real API adds `isRecommended` field
