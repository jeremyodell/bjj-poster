# Photo Upload Zone Design

**Issue:** ODE-66 - UI-BLD-002: Photo Upload Zone
**Date:** 2026-01-07
**Status:** Approved

## Summary

Photo upload component with drag-and-drop, native camera/file picker integration, inline cropping, and validation for the poster builder.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cropping library | react-image-crop | Lightweight (~13KB), matches "basic rectangle crop" requirement |
| Upload interaction | Single unified zone | Cleaner UX; native picker handles camera/gallery choice on mobile |
| Crop workflow | Inline crop after upload | Seamless flow, fewer interactions than modal approach |
| Error display | Inline message below zone | Standard form validation pattern, keeps zone usable |

## Component Structure

```
apps/web/components/builder/photo-upload/
├── photo-upload-zone.tsx      # Main component (orchestrates state)
├── upload-dropzone.tsx        # Empty state with drag-and-drop
├── image-cropper.tsx          # Preview with crop overlay
├── use-photo-upload.ts        # Hook for file handling logic
├── index.ts                   # Barrel export
└── __tests__/
    ├── photo-upload-zone.test.tsx
    ├── upload-dropzone.test.tsx
    ├── image-cropper.test.tsx
    └── use-photo-upload.test.ts
```

### PhotoUploadZone (main component)

- Manages three states: `empty` | `loading` | `preview`
- Coordinates between child components
- Connects to Zustand store via `usePosterBuilderStore.setPhoto()`

### UploadDropzone (empty state)

- Dashed border container with upload icon
- Text: "Tap to upload or drag photo here"
- Hidden `<input type="file" accept="image/jpeg,image/png,image/heic">` triggered on click/tap
- Handles dragover/drop events for desktop drag-and-drop
- Shows inline error message when validation fails

### ImageCropper (preview state)

- Displays uploaded image with react-image-crop overlay
- "Apply Crop" and "Remove" buttons below image
- Applies crop using Canvas API to create new File object
- Passes cropped file to store

### usePhotoUpload hook

- Validates file type (JPG, PNG, HEIC) and size (max 10MB)
- Creates object URL for preview
- Handles cleanup (revoking object URLs)
- Returns: `{ file, preview, error, isLoading, handleFile, clear }`

## State Flow

```
User drops/selects file
       ↓
usePhotoUpload.handleFile(file)
       ↓
Validate (type + size)
       ↓
   ┌───┴───┐
   ↓       ↓
 Valid   Invalid
   ↓       ↓
Create   Set error
preview  message
URL        ↓
   ↓    Stay in
Set     empty state
loading
   ↓
Show ImageCropper
       ↓
User adjusts crop → Apply Crop
       ↓
Canvas API creates cropped blob
       ↓
Convert blob to File object
       ↓
usePosterBuilderStore.setPhoto(croppedFile)
       ↓
Show final preview (crop complete)
```

### Data Storage

- **Local state** (usePhotoUpload hook): original file, preview URL, crop state, error, loading
- **Zustand store**: only the final cropped `File` object (via `setPhoto`)

### Validation Rules

- Allowed types: `image/jpeg`, `image/png`, `image/heic`
- Max size: 10MB (10 * 1024 * 1024 bytes)
- Error messages: "File must be JPG, PNG, or HEIC" / "File must be under 10MB"

## UI States

### Empty State

- Dashed border (`border-dashed border-2 border-primary-600`)
- Upload icon centered
- Text: "Tap to upload or drag photo here" + "JPG, PNG, HEIC - Max 10MB"
- Hover/dragover: border brightens, subtle background change
- Full area clickable

### Loading State

- Same container dimensions
- Spinner replaces icon
- Text: "Processing..."

### Preview/Crop State

- Image fills container (object-contain)
- react-image-crop handles overlay on top
- Two buttons below: primary "Apply Crop", ghost "Remove"

### Error State

- Red text appears below zone
- Zone border flashes red briefly

## Testing Strategy

### Unit Tests (usePhotoUpload hook)

- Accepts valid JPG, PNG, HEIC files under 10MB
- Rejects files over 10MB with correct error
- Rejects invalid types (PDF, GIF, etc.) with correct error
- Creates and revokes object URLs properly
- `clear()` resets all state

### Component Tests (UploadDropzone)

- Renders empty state with correct text
- Click triggers hidden file input
- Drag-and-drop sets dragover styling
- Drop calls handleFile with dropped file
- Displays error message when error prop set

### Component Tests (ImageCropper)

- Renders image preview from URL
- Crop selection updates internal state
- "Apply Crop" triggers crop callback with cropped file
- "Remove" triggers clear callback

### Integration Tests (PhotoUploadZone)

- Full flow: select file → crop → apply → store updated
- Invalid file shows error, stays in empty state
- Remove clears store and returns to empty state

## Edge Cases

- HEIC files (common on iOS) - accepted, browser handles rendering
- Very large images - crop still works, Canvas handles scaling
- User cancels file picker - no error, stays in current state
- Multiple rapid uploads - previous preview URL revoked before new one
- Mobile touch events - react-image-crop handles touch natively

## Dependencies

- `react-image-crop` - cropping UI overlay
- Existing: `@/components/ui/button`, Zustand store, Tailwind CSS
