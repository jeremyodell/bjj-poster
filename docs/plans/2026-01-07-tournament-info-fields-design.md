# Tournament Info Fields Design

**Issue:** ODE-69 - UI-BLD-005: Tournament Info & Advanced Fields
**Date:** 2026-01-07
**Status:** Approved

## Summary

Add tournament name, date, location fields with collapsible "advanced" section for optional details.

## Component Structure

```
apps/web/components/builder/tournament-info/
├── tournament-info-fields.tsx   # Main component
├── __tests__/
│   └── tournament-info-fields.test.tsx
└── index.ts                     # Re-export
```

### Fields

| Field | Visibility | Type | Validation |
|-------|-----------|------|------------|
| Tournament Name | Always visible | Text input | Required, max 100 chars |
| Date | Collapsible section | Native `<input type="date">` | Optional, format validated |
| Location | Collapsible section | Text input | Optional, max 100 chars |

### State Flow

- Local state for immediate UI updates (same pattern as AthleteInfoFields)
- `useDebouncedStoreSync` for text fields (tournament, location) with 300ms delay
- Date input syncs immediately (discrete selection, no debounce needed)
- `toggleAdvancedOptions()` from store controls collapse state

## Validation Schema

```typescript
// lib/validations/tournament-info.ts
export const MAX_TOURNAMENT_LENGTH = 100;
export const MAX_LOCATION_LENGTH = 100;

export const tournamentInfoSchema = z.object({
  tournament: z
    .string()
    .trim()
    .min(1, 'Tournament name is required')
    .max(MAX_TOURNAMENT_LENGTH, 'Tournament name must be 100 characters or less'),
  date: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Invalid date format'
    ),
  location: z
    .string()
    .trim()
    .max(MAX_LOCATION_LENGTH, 'Location must be 100 characters or less'),
});
```

## Collapsible Animation

CSS-only approach using Tailwind grid animation:

```tsx
<div
  className={cn(
    'grid transition-[grid-template-rows] duration-300 ease-out',
    showAdvancedOptions ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
  )}
>
  <div className="overflow-hidden">
    {/* Date and Location fields */}
  </div>
</div>
```

### Toggle Button

```tsx
<button
  type="button"
  onClick={toggleAdvancedOptions}
  aria-expanded={showAdvancedOptions}
  aria-controls="advanced-fields"
  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
>
  {showAdvancedOptions ? '➖ Hide details' : '➕ Add more details'}
</button>
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Date picker | Native HTML `<input type="date">` | Lightweight, no dependencies, accessible |
| Collapse animation | CSS-only (grid-rows) | No dependencies, performant, smooth |
| Toggle button style | Text button with emoji icons | Matches issue spec, subtle appearance |

## Test Coverage

```typescript
describe('TournamentInfoFields', () => {
  // Validation
  it('shows error when tournament name is empty on blur');
  it('clears error when valid tournament name entered');
  it('shows error when tournament name exceeds 100 chars');
  it('shows error when location exceeds 100 chars');

  // Collapsible behavior
  it('hides advanced fields by default');
  it('expands advanced section when "Add more details" clicked');
  it('collapses advanced section when "Hide details" clicked');
  it('toggles aria-expanded on button');

  // Date picker
  it('renders date input with type="date"');
  it('syncs date to store on change');

  // Auto-save
  it('debounces tournament name sync to store (300ms)');
  it('debounces location sync to store (300ms)');
  it('does not sync invalid values to store');

  // Store integration
  it('initializes from store values');
  it('reflects store showAdvancedOptions state');
});
```
