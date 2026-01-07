# ODE-70: Generate Button & Preview Modal Design

**Date:** 2026-01-07
**Issue:** [ODE-70](https://linear.app/odell/issue/ODE-70/ui-bld-006-generate-button-and-preview-modal)
**Status:** Approved

## Summary

Build the "Generate Poster" button with validation, floating preview button, and full-screen preview modal for the BJJ poster builder.

## Component Architecture

```
components/builder/
├── poster-builder-form/
│   ├── poster-builder-form.tsx      # Unified wrapper with sticky generate button
│   ├── generate-button.tsx          # The generate button with validation logic
│   ├── floating-preview-button.tsx  # Corner button with live thumbnail
│   ├── preview-modal.tsx            # Full-screen/overlay preview dialog
│   ├── poster-preview-canvas.tsx    # Client-side mockup renderer
│   └── index.ts
```

## Components

### 1. PosterBuilderForm

Unified wrapper component that:
- Wraps PhotoUploadZone, AthleteInfoFields, TournamentInfoFields, TemplateSelector
- Contains GenerateButton at the bottom (sticky on mobile)
- Renders FloatingPreviewButton (fixed position, bottom-right)
- Manages PreviewModal open/close state

### 2. GenerateButton

**States:**
- **Disabled:** Gray background, tooltip "Complete required fields"
- **Enabled:** Primary blue, text "Generate Poster"
- **Loading:** Spinner + progress bar, text "Generating... X%"

**Validation (all required):**
- `athletePhoto`
- `athleteName`
- `beltRank`
- `tournament`
- `selectedTemplateId`

**Mobile behavior:** Sticky bottom with gradient background to prevent content bleed-through.

### 3. FloatingPreviewButton

**Position:** Fixed, bottom-right (`bottom: 6rem` mobile, `bottom: 2rem` desktop)

**States:**
- Hidden when no form data
- Partial data: Eye icon with placeholder, subtle pulse
- Valid: Eye icon with live thumbnail, stronger pulse

**Thumbnail:** 60x80px canvas showing template + photo + text preview, updates in real-time.

### 4. PreviewModal

**Built on:** Existing Radix Dialog component

**Layout:**
- Mobile: Full-screen, no padding
- Desktop: Centered overlay, max-width 800px

**Dismissal:**
- Swipe down > 100px on mobile
- ESC key (built into Radix)
- Close button (X)

### 5. PosterPreviewCanvas

**Approach:** HTML/CSS composition (not canvas element)

**Layers:**
1. Template background image
2. Athlete photo (positioned in template's photo zone)
3. Text overlays (name, belt rank, tournament, date, location)

**Fallbacks:**
- No template: Placeholder grid pattern
- No photo: Silhouette placeholder
- Missing text: Fields don't render

## Mock Generation API

**Location:** `lib/api/generate-poster.ts`

```typescript
interface GeneratePosterRequest {
  athletePhoto: File
  athleteName: string
  beltRank: BeltRank
  team?: string
  tournament: string
  date?: string
  location?: string
  templateId: string
}

interface GeneratePosterResponse {
  posterId: string
  imageUrl: string
  createdAt: string
}
```

**Mock behavior:**
- Simulates progress: 0→30% (upload), 30→90% (processing), 90→100% (finalization)
- Total duration: ~2.3 seconds
- Returns mock poster ID and placeholder image URL

## Store Integration

Add `generatePoster` action to `usePosterBuilderStore`:
- Sets `isGenerating: true` and updates `generationProgress`
- Calls mock API with progress callback
- Handles success/error states

## Design Patterns

Following established codebase patterns:
- Zustand store with `useShallow` for performance
- Existing UI components (Button, Dialog)
- Tailwind dark theme (primary-950/900/800)
- Accessibility (aria labels, keyboard navigation)
- Co-located tests in `__tests__/` folders

## Test Approach

- Generate button disabled when fields empty
- Button enables when all required fields filled
- Floating preview button appears with form data
- Preview button opens modal
- Modal shows poster preview
- ESC key closes modal
- Swipe down closes on mobile
- Generate triggers API call with progress updates
