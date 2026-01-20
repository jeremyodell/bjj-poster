# Stories: UI/UX for BJJ Poster Builder Web App

**Date:** 2026-01-05
**Total:** 26 stories
**Ready for upload:** Pending review

---

## Dependency Graph

```
Epic UI-FND: Foundation & Design System
    UI-FND-001: Next.js 14 Project Scaffolding
        ↓
    UI-FND-002: shadcn/ui Component Library Setup (blocked by UI-FND-001)
        ↓
    UI-FND-003: Zustand Store Setup (blocked by UI-FND-001)
        ↓
    UI-FND-004: TanStack Query Setup (blocked by UI-FND-001)

Epic UI-LND: Landing & Marketing Pages (blocked by UI-FND-002)
    UI-LND-001: Landing Page Hero & CTA
    UI-LND-002: Pricing Page
    UI-LND-003: Auth Pages (Signup/Login)

Epic UI-BLD: Poster Builder Core (blocked by UI-FND)
    UI-BLD-001: Builder Layout & Header (blocked by UI-FND-002, UI-FND-003)
    UI-BLD-002: Photo Upload Zone (blocked by UI-FND-002, UI-FND-003)
    UI-BLD-003: Template Selector (blocked by UI-FND-002, UI-FND-004)
    UI-BLD-004: Athlete Info Form Fields (blocked by UI-FND-002, UI-FND-003)
        ↓
    UI-BLD-005: Tournament Info & Advanced Fields (blocked by UI-BLD-004)
    UI-BLD-006: Generate Button & Preview Modal (blocked by UI-FND-002, UI-FND-003)

Epic UI-DSH: Dashboard & Poster Management (blocked by UI-FND)
    UI-DSH-001: Dashboard Layout & Header (blocked by UI-FND-002, UI-FND-003)
    UI-DSH-002: Usage Card & Quota Display (blocked by UI-FND-002, UI-FND-003)
    UI-DSH-003: Poster Grid & Cards (blocked by UI-FND-002, UI-FND-004)
        ↓
    UI-DSH-004: Filter, Sort, Empty States (blocked by UI-DSH-003)

Epic UI-SUB: Subscription & Upgrade Flow (blocked by UI-FND)
    UI-SUB-001: Upgrade Prompt Component (blocked by UI-FND-002)
        ↓
    UI-SUB-002: Quota Limit Modal (blocked by UI-SUB-001, UI-FND-003)
        ↓
    UI-SUB-003: Stripe Checkout Integration (blocked by UI-LND-002, UI-SUB-002)

Epic UI-ONB: Onboarding & First-Time UX (blocked by UI-FND, UI-BLD)
    UI-ONB-001: Welcome Splash Screen (blocked by UI-FND-002)
    UI-ONB-002: Guided Tooltips in Builder (blocked by all UI-BLD stories)
    UI-ONB-003: First Poster Celebration (blocked by UI-BLD-006, UI-DSH-001)

Epic UI-POL: Polish & Performance (blocked by all previous epics)
    UI-POL-001: Loading States & Animations (blocked by UI-BLD-006)
    UI-POL-002: Error Handling & Edge Cases (blocked by all UI-BLD, UI-DSH)
    UI-POL-003: Accessibility & Performance Audit (blocked by all stories)
```

---

## Epic UI-FND: Foundation & Design System

### Story UI-FND-001: Next.js 14 Project Scaffolding

#### Summary
Set up Next.js 14 App Router project with TypeScript, Tailwind CSS, and design system tokens for consistent development environment

#### Acceptance Criteria
- [ ] Next.js 14 installed with App Router
- [ ] TypeScript configured with strict mode
- [ ] Tailwind CSS v3 installed and configured
- [ ] ESLint with Next.js config
- [ ] Prettier configured for code formatting
- [ ] Project builds and dev server runs
- [ ] `.gitignore` properly configured
- [ ] README updated with setup instructions

#### Technical Notes
Initialize Next.js 14 app in `apps/web/` directory using create-next-app with TypeScript and Tailwind flags. Configure strict TypeScript mode with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` enabled.

Configure Tailwind with custom design tokens:
- **Colors:** Primary indigo/blue scale (#1a1f3a → #4361ee), accent gold (#d4af37, #ffd700)
- **Fonts:** Archivo Black (display), DM Sans (body), JetBrains Mono (accent)
- **Content paths:** `./app/**/*.{js,ts,jsx,tsx,mdx}`, `./components/**/*.{js,ts,jsx,tsx,mdx}`

Add Google Fonts using Next.js font optimization with variable font loading for Archivo Black, DM Sans, and JetBrains Mono.

#### Test Approach
- Verify dev server runs on localhost:3000
- Verify build completes without errors (`pnpm build`)
- Verify Tailwind classes apply correctly in browser
- Verify custom fonts load (check DevTools Network tab)
- Check TypeScript strict mode catches type errors

#### Dependencies
- **Blocked by:** None (starting point)
- **Blocks:** UI-FND-002, UI-FND-003, UI-FND-004

#### Suggested Labels
`setup`, `frontend`

---

### Story UI-FND-002: shadcn/ui Component Library Setup

#### Summary
Install and configure shadcn/ui component library with core components for consistent, accessible UI

#### Acceptance Criteria
- [ ] shadcn/ui initialized in project
- [ ] Core components installed (Button, Card, Input, Select, Textarea, Dialog, Sheet, Tooltip)
- [ ] Components styled with design system colors
- [ ] Component library documented in demo page
- [ ] All components render correctly

#### Technical Notes
Initialize shadcn/ui using CLI with Default style and Slate base color. Install core components: button, card, input, select, textarea, dialog, sheet, tooltip, dropdown-menu, avatar, badge.

Create demo page at `apps/web/app/components-demo/page.tsx` showcasing all installed components with proper variants (primary, secondary, ghost buttons; default, destructive states).

Components automatically integrate with Tailwind config from UI-FND-001, using CSS variables for theming.

#### Test Approach
- Navigate to `/components-demo` and verify all components render
- Test button variants (default, secondary, ghost)
- Test input focus states and styling
- Test card shadows and borders
- Verify components match design system colors
- Test mobile responsiveness of components

#### Dependencies
- **Blocked by:** UI-FND-001 (requires Tailwind config)
- **Blocks:** UI-LND-001, UI-LND-002, UI-LND-003, UI-BLD-001, UI-BLD-002, UI-BLD-003, UI-BLD-004, UI-BLD-006, UI-DSH-001, UI-DSH-002, UI-DSH-003, UI-SUB-001, UI-ONB-001

#### Suggested Labels
`setup`, `frontend`

---

### Story UI-FND-003: Zustand Store Setup

#### Summary
Configure Zustand stores for global state management (poster builder, user session, quota tracking)

#### Acceptance Criteria
- [ ] Zustand installed
- [ ] `usePosterBuilderStore` created with form state
- [ ] `useUserStore` created with user session and quota
- [ ] Stores have TypeScript interfaces
- [ ] DevTools enabled for debugging
- [ ] Unit tests for store actions
- [ ] LocalStorage persistence for builder drafts

#### Technical Notes
Install Zustand and create two stores:

**`usePosterBuilderStore`:** Manages poster creation form state including athletePhoto, athleteName, beltRank, team, tournament, date, location, selectedTemplateId, isGenerating, generationProgress, showAdvancedOptions, showPreview. Includes actions: setPhoto, setField, setTemplate, setGenerating, toggleAdvancedOptions, togglePreview, reset.

**`useUserStore`:** Manages user session with user object, subscriptionTier ('free' | 'pro' | 'premium'), postersThisMonth, postersLimit. Includes actions: setUser, canCreatePoster (boolean check), incrementUsage.

Implement persistence middleware for builder store, saving draft to localStorage with key 'poster-builder-draft'. Partialize to exclude UI state and File objects.

Write unit tests for core actions (setField, reset, canCreatePoster, incrementUsage).

#### Test Approach
- Run unit tests with Vitest: `pnpm test lib/stores`
- Test setField updates state correctly
- Test reset clears all form fields
- Test canCreatePoster returns true when under quota
- Test canCreatePoster returns false when at limit (free tier)
- Test incrementUsage increments postersThisMonth
- Test localStorage persistence (fill form, refresh page, verify data restored)

#### Dependencies
- **Blocked by:** UI-FND-001 (requires TypeScript config)
- **Blocks:** UI-BLD-001, UI-BLD-002, UI-BLD-004, UI-BLD-005, UI-BLD-006, UI-DSH-001, UI-DSH-002, UI-SUB-002

#### Suggested Labels
`setup`, `frontend`, `testing`

---

### Story UI-FND-004: TanStack Query Setup

#### Summary
Configure TanStack Query for server state management with caching for templates, user data, and poster history

#### Acceptance Criteria
- [ ] TanStack Query installed
- [ ] QueryClient configured with sensible defaults
- [ ] Query provider wrapping app
- [ ] DevTools enabled
- [ ] Mock API hooks created (useTemplates, usePosterHistory)
- [ ] Loading and error states handled
- [ ] Unit tests for custom hooks

#### Technical Notes
Install `@tanstack/react-query` and `@tanstack/react-query-devtools`. Create QueryClient with defaults: staleTime 5 minutes, gcTime 30 minutes, retry 1, refetchOnWindowFocus false.

Create `apps/web/app/providers.tsx` with QueryClientProvider wrapper including ReactQueryDevtools. Wrap app in `layout.tsx`.

Create custom hooks:
- **`useTemplates()`:** Fetches templates from `/api/templates`, query key `['templates']`
- **`usePosterHistory()`:** Fetches user's posters, query key `['posters', userId]`

Define TypeScript interfaces: Template (id, name, category, thumbnailUrl).

#### Test Approach
- Verify app builds successfully
- Check React Query DevTools appear in browser (bottom-left icon)
- Test useTemplates hook loads data (mock API response)
- Test loading state shows skeleton
- Test error state shows error message
- Verify templates cache persists across page navigations
- Run unit tests for hooks with mock QueryClient

#### Dependencies
- **Blocked by:** UI-FND-001 (requires Next.js setup)
- **Blocks:** UI-BLD-003, UI-DSH-003

#### Suggested Labels
`setup`, `frontend`, `testing`

---

## Epic UI-LND: Landing & Marketing Pages

### Story UI-LND-001: Landing Page Hero & CTA

#### Summary
Create engaging landing page with hero section, example posters, "How It Works" steps, and CTA to drive signups

#### Acceptance Criteria
- [ ] Hero section with headline, subheadline, CTA
- [ ] 3 example poster images displayed
- [ ] "How It Works" 3-step section
- [ ] Mobile-responsive layout
- [ ] Accessible (ARIA labels, semantic HTML)
- [ ] Fast LCP (<2.5s)

#### Technical Notes
Create landing page at `apps/web/app/page.tsx` with:

**Hero Section:**
- H1: "Create Tournament Posters in Minutes" (48px, Archivo Black)
- Subheadline: "Professional BJJ posters for athletes. No design skills needed." (24px, DM Sans)
- 3 example poster images (optimized WebP, lazy loaded)
- Primary CTA button: "Create Free Poster" → `/auth/signup`
- Social proof badge: "Join 1,000+ BJJ athletes"

**How It Works Section:**
- 3 steps with icons: 📸 Upload Photo → 🎨 Choose Template → ⚡ Download & Share
- Card-based layout, responsive grid (1 col mobile, 3 cols desktop)

Use Next.js Image component with priority loading for hero images. Implement semantic HTML (header, main, section, footer). Add proper alt text for accessibility.

#### Test Approach
- Lighthouse performance audit (target LCP <2.5s)
- Test mobile responsiveness at 375px, 768px, 1440px
- Verify CTA button links to `/auth/signup`
- Test keyboard navigation (Tab through interactive elements)
- Run accessibility audit (WCAG 2.1 AA)
- Verify images load correctly in all browsers

#### Dependencies
- **Blocked by:** UI-FND-002 (requires shadcn/ui components)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

### Story UI-LND-002: Pricing Page

#### Summary
Build pricing comparison page with Free/Pro/Premium tiers, monthly/annual toggle, and clear CTAs

#### Acceptance Criteria
- [ ] Three-column comparison table (Free, Pro, Premium)
- [ ] Monthly/annual toggle
- [ ] Feature list with checkmarks/X marks
- [ ] Clear CTAs for each tier
- [ ] Mobile-responsive (stacked cards on mobile)
- [ ] Accessible comparison table

#### Technical Notes
Create pricing page at `apps/web/app/pricing/page.tsx` with:

**Pricing Tiers:**
- **Free:** $0/month, 2 posters, 720p, watermarked, 7-day storage
- **Pro:** $9.99/month, 20 posters, 1080p HD, no watermark, background removal, 6-month storage
- **Premium:** $29.99/month, unlimited posters, 4K Ultra HD, no watermark, AI background, infinite storage

**Components:**
- `PricingTable`: Three-column comparison (desktop), stacked cards (mobile <768px)
- `PricingCard`: Individual tier with feature list, price, CTA
- Monthly/Annual toggle (20% discount display for annual)

Use semantic table markup with proper headers, ARIA labels for screen readers. Highlight "Most Popular" badge on Pro tier.

#### Test Approach
- Test monthly/annual toggle switches pricing correctly
- Verify all feature checkmarks/X marks render
- Test CTAs link to correct signup/upgrade flows
- Test responsive layout on mobile (cards stack vertically)
- Verify table is navigable with keyboard
- Run accessibility audit (ensure proper table semantics)

#### Dependencies
- **Blocked by:** UI-FND-002 (requires shadcn/ui components)
- **Blocks:** UI-SUB-003 (provides pricing info for Stripe integration)

#### Suggested Labels
`frontend`, `design`

---

### Story UI-LND-003: Auth Pages (Signup/Login)

#### Summary
Build signup and login pages with form validation, password toggle, and loading states

#### Acceptance Criteria
- [ ] Signup form (email, password)
- [ ] Login form (email, password)
- [ ] Form validation with error messages
- [ ] Password visibility toggle
- [ ] "Forgot password" link
- [ ] Mobile-friendly forms
- [ ] Loading states on submit

#### Technical Notes
Create auth pages at:
- `apps/web/app/auth/signup/page.tsx`
- `apps/web/app/auth/login/page.tsx`

Create shared `AuthForm` component with:
- Email input (type="email", autocomplete="email")
- Password input with visibility toggle (eye icon)
- Submit button with loading spinner
- Zod validation schemas in `apps/web/lib/validations/auth.ts`

**Validation Rules:**
- Email: Valid email format, required
- Password: Minimum 8 characters, required
- Show inline error messages (red text below field)

Use shadcn/ui Input, Button components. Style with Athletic Brutalism design (bold headings, high contrast).

#### Test Approach
- Test form validation (invalid email, short password)
- Verify error messages appear inline
- Test password visibility toggle shows/hides password
- Test loading state on submit (disable button, show spinner)
- Test "Forgot password" link is present
- Test mobile layout at 375px width
- Verify forms are keyboard-navigable

#### Dependencies
- **Blocked by:** UI-FND-002 (requires shadcn/ui components)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

## Epic UI-BLD: Poster Builder Core

### Story UI-BLD-001: Builder Layout & Header

#### Summary
Create poster builder layout with sticky header showing logo, quota badge, and user menu

#### Acceptance Criteria
- [ ] Builder layout component
- [ ] Header with logo, quota display, user menu
- [ ] Responsive header (hamburger on mobile)
- [ ] Quota badge shows "X of Y used"
- [ ] User menu dropdown (settings, logout)
- [ ] Header is sticky on scroll

#### Technical Notes
Create `apps/web/app/builder/layout.tsx` with:

**BuilderHeader Component:**
- Logo (left): Links to `/dashboard`
- Quota Badge (center-right): Reads from `useUserStore`, displays "2 of 2 used" (free tier) with color-coded indicator (green: under 50%, yellow: 50-80%, red: 80-100%)
- User Menu (right): Dropdown with user avatar, name, Settings link, Logout button

**Mobile (<768px):**
- Hamburger menu icon (replaces full nav)
- Slide-in drawer with navigation links
- Quota badge visible in header

**Sticky Header:**
- `position: sticky`, `top: 0`, `z-index: 50`
- Background with slight blur on scroll

Use Zustand `useUserStore` to read postersThisMonth, postersLimit.

#### Test Approach
- Verify header sticks to top on scroll
- Test quota badge displays correct count
- Test quota badge color changes (green → yellow → red)
- Test user menu dropdown opens/closes
- Test mobile hamburger menu slides in
- Verify logo links to `/dashboard`
- Test logout button triggers logout action

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui), UI-FND-003 (Zustand stores)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

### Story UI-BLD-002: Photo Upload Zone

#### Summary
Build photo upload component with camera/file picker, drag-and-drop, crop tool, and validation

#### Acceptance Criteria
- [ ] Photo upload zone with drag-and-drop
- [ ] "Take Photo" button (opens camera on mobile)
- [ ] "Choose from Library" button (file picker)
- [ ] Image preview after upload
- [ ] Crop tool (basic rectangle crop)
- [ ] File validation (format, size)
- [ ] Error handling (file too large, invalid format)
- [ ] Loading state during upload

#### Technical Notes
Create `PhotoUploadZone` component with:

**Upload Methods:**
1. **Drag-and-drop:** Drop zone with dashed border, "Drop photo here" text
2. **Camera (mobile):** Button with `<input type="file" accept="image/*" capture="environment">` for rear camera
3. **File picker:** Button opens native file dialog

**Validation:**
- Formats: JPG, PNG, HEIC
- Max size: 10MB
- Show error messages for invalid files

**Image Preview & Crop:**
- After upload, show preview with crop overlay
- Basic rectangle crop using HTML5 Canvas
- "Apply Crop" button stores cropped image in Zustand

**States:**
- Empty: Large dashed border, camera icon, "Tap to upload" text
- Loading: Spinner overlay
- Preview: Image with crop controls, "Change Photo" button

Save uploaded photo to `usePosterBuilderStore.setPhoto(file)`.

#### Test Approach
- Test drag-and-drop uploads image
- Test "Take Photo" opens camera on mobile device
- Test "Choose from Library" opens file picker
- Test file validation rejects files >10MB
- Test file validation rejects PDF, GIF files
- Test error messages display correctly
- Test crop tool applies crop to image
- Verify cropped image stored in Zustand

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui), UI-FND-003 (Zustand)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

### Story UI-BLD-003: Template Selector

#### Summary
Build template selector with recommended templates and expandable "Browse All" section

#### Acceptance Criteria
- [ ] "Recommended for you" section (3 templates)
- [ ] Expandable "Browse all" section
- [ ] Template grid (responsive: 1 col mobile, 2-3 desktop)
- [ ] Template thumbnails load from API
- [ ] Selected template highlighted
- [ ] Template categories/filters
- [ ] Loading state while fetching templates
- [ ] Error state if templates fail to load

#### Technical Notes
Create `TemplateSelector` component using TanStack Query:

**Recommended Section:**
- Fetch templates with `useTemplates()` hook
- Show first 3 templates (hardcoded logic: "Classic", "Bold", "Minimal")
- Display as horizontal carousel on mobile, grid on desktop

**Browse All Section:**
- Collapsible section (default: collapsed)
- "Browse all templates ▼" button expands
- Grid layout: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
- Filter by category (Traditional, Modern, Minimalist, Bold)

**Template Card:**
- Thumbnail image (300×400px, WebP)
- Template name
- Selected state: Blue border, checkmark badge
- Click sets `usePosterBuilderStore.setTemplate(templateId)`

**States:**
- Loading: Skeleton grid (3 cards)
- Error: "Couldn't load templates. Retry?" with button
- Empty: "No templates found" (shouldn't happen)

#### Test Approach
- Verify 3 recommended templates display on load
- Test template selection highlights selected card
- Test "Browse all" expands/collapses
- Test template grid responsive layout
- Test loading state shows skeletons
- Test error state shows retry button
- Verify selected template saved to Zustand
- Test category filters work (if implemented)

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui), UI-FND-004 (TanStack Query)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

### Story UI-BLD-004: Athlete Info Form Fields

#### Summary
Create form fields for athlete name, belt rank, and team with real-time validation and auto-save

#### Acceptance Criteria
- [ ] Athlete name input (text)
- [ ] Belt rank select (dropdown with belt colors)
- [ ] Team input (text, optional)
- [ ] Real-time validation
- [ ] Error messages inline
- [ ] Fields auto-save to Zustand store
- [ ] Fields restore from localStorage on mount

#### Technical Notes
Create `AthleteInfoFields` component with:

**Fields:**
1. **Athlete Name:** Text input, required, max 50 chars
2. **Belt Rank:** Select dropdown with options: White, Blue, Purple, Brown, Black, Red/Black, Red. Each option styled with belt color icon.
3. **Team:** Text input, optional, max 50 chars

**Validation (Zod):**
```typescript
athleteName: z.string().min(1, "Name is required").max(50)
beltRank: z.enum(["White", "Blue", "Purple", "Brown", "Black"])
team: z.string().max(50).optional()
```

**Auto-save:**
- On input change (debounced 300ms), call `usePosterBuilderStore.setField(field, value)`
- Store persists to localStorage via Zustand middleware

**Restore on mount:**
- Read from `usePosterBuilderStore` state (automatically restored from localStorage)

#### Test Approach
- Test athlete name shows error when empty on blur
- Test belt rank dropdown shows all belt options
- Test team field is optional (no error when empty)
- Test real-time validation (type invalid data, see error)
- Test auto-save (fill field, refresh page, verify data restored)
- Verify Zustand store updates on field change
- Test max length validation (51 chars in name)

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui), UI-FND-003 (Zustand)
- **Blocks:** UI-BLD-005 (tournament fields build on athlete fields)

#### Suggested Labels
`frontend`, `design`

---

### Story UI-BLD-005: Tournament Info & Advanced Fields

#### Summary
Add tournament name, date, location fields with collapsible "advanced" section for optional details

#### Acceptance Criteria
- [ ] Tournament name input (always visible)
- [ ] Date picker input (optional)
- [ ] Location input (optional)
- [ ] "Add more details" expander button
- [ ] Advanced section collapsible
- [ ] Fields auto-save to store

#### Technical Notes
Create `TournamentInfoFields` component with:

**Always Visible:**
- **Tournament Name:** Text input, required, max 100 chars

**Collapsible "Advanced" Section:**
- Collapsed by default
- "➕ Add more details" button expands
- Contains:
  - **Date:** Date picker (shadcn/ui Calendar component)
  - **Location:** Text input, max 100 chars

**Behavior:**
- Clicking "Add more details" toggles `usePosterBuilderStore.toggleAdvancedOptions()`
- Section slides open with smooth animation
- All fields auto-save to Zustand on change (debounced 300ms)

**Validation:**
- Tournament name: Required
- Date: Optional, must be valid date if provided
- Location: Optional

#### Test Approach
- Test tournament name shows error when empty
- Test "Add more details" expands/collapses section
- Test date picker opens calendar
- Test location field accepts text
- Test all fields auto-save to Zustand
- Test collapsed state persists (localStorage)
- Verify smooth animation on expand/collapse

#### Dependencies
- **Blocked by:** UI-BLD-004 (builds on athlete fields pattern)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

### Story UI-BLD-006: Generate Button & Preview Modal

#### Summary
Build "Generate Poster" button with validation, floating preview button, and full-screen preview modal

#### Acceptance Criteria
- [ ] Generate button (sticky bottom on mobile)
- [ ] Button disabled if required fields missing
- [ ] Floating "Preview" button with thumbnail badge
- [ ] Preview modal (full-screen on mobile)
- [ ] Preview shows live-updated poster mockup
- [ ] Modal dismissible (swipe down on mobile, ESC key)
- [ ] Generate triggers poster creation API call

#### Technical Notes
Create components:

**`GenerateButton`:**
- Sticky bottom on mobile: `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`
- Desktop: Regular button at form bottom
- Disabled state: Gray background, "Complete required fields" tooltip
- Active state: Primary blue, "Generate Poster 🎨" text
- Click calls `usePosterBuilderStore.generatePoster()` (triggers API mutation)

**`FloatingPreviewButton`:**
- Fixed position: bottom-right corner
- Eye icon with small thumbnail badge
- Pulse animation when form is valid
- Click opens `PreviewModal`

**`PreviewModal`:**
- Full-screen on mobile (`height: 100vh`)
- Centered overlay on desktop (`max-width: 800px`)
- Shows live poster preview (canvas rendering based on form data)
- Swipe down gesture dismisses on mobile
- ESC key dismisses
- "Generate" button inside modal (alternative to sticky button)

**Validation Check:**
- Required fields: athletePhoto, athleteName, beltRank, tournament, selectedTemplateId
- Button disabled if any required field empty

#### Test Approach
- Test generate button disabled when fields empty
- Test button enables when all required fields filled
- Test floating preview button appears
- Test preview button opens modal
- Test modal shows poster preview
- Test ESC key closes modal
- Test swipe down closes modal on mobile
- Verify generate button triggers API call

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui), UI-FND-003 (Zustand)
- **Blocks:** UI-POL-001 (loading states), UI-ONB-003 (celebration screen)

#### Suggested Labels
`frontend`, `design`

---

## Epic UI-DSH: Dashboard & Poster Management

### Story UI-DSH-001: Dashboard Layout & Header

#### Summary
Create dashboard with welcome header, usage indicator, and "Create New" CTA

#### Acceptance Criteria
- [ ] Welcome header with user name
- [ ] Usage indicator (X of Y posters used)
- [ ] "Create New Poster" CTA card
- [ ] Mobile-responsive layout
- [ ] Navigation to builder

#### Technical Notes
Create dashboard at `apps/web/app/dashboard/page.tsx` with:

**Header Section:**
- Welcome message: "Welcome back, {userName}! 👋" (H1, 32px)
- Usage display: "2 of 2 posters used" (reads from `useUserStore`)
- Upgrade CTA for free users: "Upgrade to Pro →" button (links to `/pricing`)

**Create New Card:**
- Prominent card with dashed border
- Large "➕ Create New Poster" button
- Links to `/builder`
- Positioned above poster grid

**Layout:**
- Mobile: Single column, full width
- Desktop: Max-width container (1200px), centered

Use `useUserStore` to get user data and quota info.

#### Test Approach
- Verify welcome message shows user's name
- Test usage indicator displays correct quota
- Test "Create New" button links to `/builder`
- Test upgrade CTA shows only for free users
- Test responsive layout on mobile/desktop
- Verify header renders correctly

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui), UI-FND-003 (Zustand)
- **Blocks:** UI-ONB-003 (celebration redirects to dashboard)

#### Suggested Labels
`frontend`, `design`

---

### Story UI-DSH-002: Usage Card & Quota Display

#### Summary
Build usage card showing poster quota with visual indicator and upgrade CTA for free users

#### Acceptance Criteria
- [ ] Usage card displays "X of Y posters used"
- [ ] Visual progress bar (0-100%)
- [ ] Color-coded indicator (green/yellow/red)
- [ ] Upgrade CTA for free users at limit
- [ ] Different messaging for each tier

#### Technical Notes
Create `UsageCard` component with:

**Display Logic:**
- Read `postersThisMonth`, `postersLimit`, `subscriptionTier` from `useUserStore`
- Calculate percentage: `(postersThisMonth / postersLimit) * 100`

**Visual Indicator:**
- Progress bar:
  - Green: 0-50%
  - Yellow: 50-80%
  - Red: 80-100%
- Text: "2 of 2 posters used"

**Tier-Specific Messaging:**
- **Free (at limit):** "You've used all 2 free posters this month. Upgrade for 20/month!" + "Upgrade to Pro" button
- **Free (under limit):** "1 of 2 posters used. You have 1 left this month."
- **Pro:** "8 of 20 posters used. 12 remaining."
- **Premium:** "Create unlimited posters ∞"

**Card Style:**
- White background, shadow, rounded corners
- Prominent placement below header

#### Test Approach
- Test progress bar fills correctly (50% = half full)
- Test color changes (green at 40%, yellow at 60%, red at 90%)
- Test upgrade CTA shows only for free users at limit
- Test different tier messaging displays correctly
- Verify data reads from Zustand store
- Test card responsive layout

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui), UI-FND-003 (Zustand)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

### Story UI-DSH-003: Poster Grid & Cards

#### Summary
Build grid of poster cards with thumbnails and actions (download, share, duplicate)

#### Acceptance Criteria
- [ ] Poster grid with responsive layout
- [ ] Poster cards show thumbnail, title, metadata
- [ ] Download action button
- [ ] Share action button (social media)
- [ ] Duplicate action (copy to builder)
- [ ] Loading state (skeleton cards)
- [ ] Empty state ("No posters yet")

#### Technical Notes
Create `PosterGrid` component using TanStack Query:

**Fetch Posters:**
- Use `usePosterHistory()` hook
- Query key: `['posters', userId]`
- Returns array of Poster objects: `{ id, thumbnailUrl, athleteName, tournament, beltRank, createdAt, status }`

**Grid Layout:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Gap: 24px (gap-6)

**Poster Card Component:**
- Thumbnail image (aspect ratio 3:4)
- Title: `{tournament}` (H3)
- Subtitle: `{beltRank} • {createdAt}`
- Action buttons:
  - 📥 Download (triggers download)
  - 💬 Share (opens share modal with social links)
  - 📋 Duplicate (copies data to builder, navigates to `/builder`)

**States:**
- Loading: Show 6 skeleton cards
- Empty: Show "No posters yet" message with "Create Poster" button
- Error: "Couldn't load posters. Retry?" button

#### Test Approach
- Verify posters load from API
- Test grid responsive layout (1, 2, 3 cols)
- Test download button triggers file download
- Test share button opens share modal
- Test duplicate button navigates to builder with pre-filled data
- Test loading state shows skeletons
- Test empty state shows message
- Verify error state shows retry button

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui), UI-FND-004 (TanStack Query)
- **Blocks:** UI-DSH-004 (filter/sort depends on grid)

#### Suggested Labels
`frontend`, `design`

---

### Story UI-DSH-004: Filter, Sort, Empty States

#### Summary
Add filter and sort controls to poster grid with improved empty states

#### Acceptance Criteria
- [ ] Filter dropdown (All, Recent, By Belt Rank)
- [ ] Sort dropdown (Newest, Oldest, A-Z)
- [ ] Filters update grid in real-time
- [ ] Empty states for filtered results
- [ ] Clear filters button

#### Technical Notes
Create `FilterSort` component above poster grid:

**Filter Options:**
- **All:** No filter
- **Recent:** Created in last 7 days
- **By Belt Rank:** Dropdown with belt options (White, Blue, Purple, etc.)

**Sort Options:**
- **Newest:** Sort by `createdAt` DESC
- **Oldest:** Sort by `createdAt` ASC
- **A-Z:** Sort by `tournament` alphabetically

**Implementation:**
- Store filter/sort state in local component state (not Zustand)
- Apply filters/sorts to poster array before rendering
- Show "Clear filters" button when filters active

**Empty States:**
- No posters at all: "No posters yet. Create your first!"
- Filtered with no results: "No posters match your filters. Try clearing filters."

**UI:**
- Two dropdown selects side-by-side on desktop
- Stacked on mobile
- "Clear filters" button appears when filter != "All"

#### Test Approach
- Test filter dropdown filters posters correctly
- Test sort dropdown sorts posters correctly
- Test "Clear filters" button resets filters
- Test filtered empty state message
- Test filters work together (filter + sort)
- Verify real-time updates (no page reload)

#### Dependencies
- **Blocked by:** UI-DSH-003 (requires poster grid)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

## Epic UI-SUB: Subscription & Upgrade Flow

### Story UI-SUB-001: Upgrade Prompt Component

#### Summary
Create reusable UpgradePrompt component for consistent upgrade CTAs throughout app

#### Acceptance Criteria
- [ ] Reusable component with props for context
- [ ] Shows tier benefits (Pro vs Premium)
- [ ] Primary CTA button (links to pricing or Stripe)
- [ ] Dismissible (close button)
- [ ] Tracks upgrade prompt views (analytics)

#### Technical Notes
Create `UpgradePrompt` component in `apps/web/components/upgrade/`:

**Props:**
```typescript
interface UpgradePromptProps {
  variant: 'banner' | 'card' | 'modal'
  targetTier: 'pro' | 'premium'
  source: string // for analytics tracking
  onDismiss?: () => void
}
```

**Variants:**
- **Banner:** Slim horizontal banner, appears at top of dashboard
- **Card:** Full card with benefits list, used in dashboard sidebar
- **Modal:** Full-screen overlay, used for quota limit blocking

**Content:**
- Headline: "Upgrade to {tier}"
- Benefits list: Specific to tier (e.g., Pro: "20 posters/month, HD exports, No watermark")
- CTA button: "Upgrade Now" → `/pricing` or Stripe Checkout
- Close button (X icon) for dismissible variants

**Analytics:**
- Track `upgrade_prompt_viewed` event with source prop
- Track `upgrade_prompt_clicked` when CTA clicked
- Track `upgrade_prompt_dismissed` when closed

#### Test Approach
- Test all three variants render correctly
- Test Pro vs Premium shows different benefits
- Test CTA button links to pricing page
- Test close button dismisses component
- Test analytics events fire correctly
- Verify component is reusable in multiple contexts

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui)
- **Blocks:** UI-SUB-002 (quota modal uses this component)

#### Suggested Labels
`frontend`, `design`

---

### Story UI-SUB-002: Quota Limit Modal

#### Summary
Build friendly blocking modal for free users at quota limit with upgrade incentive

#### Acceptance Criteria
- [ ] Modal shows when user hits quota limit
- [ ] Displays user's created posters (thumbnails)
- [ ] Clear upgrade benefits
- [ ] Primary CTA to upgrade (Stripe Checkout)
- [ ] Secondary option: "Wait until [next month]"
- [ ] Not dismissible without action

#### Technical Notes
Create `QuotaLimitModal` component:

**Trigger Logic:**
- Check `useUserStore.canCreatePoster()` before allowing builder access
- If `false` and tier is 'free', show modal
- Modal overlays entire screen, blocks interaction

**Content:**
- **Header:** "🎉 You've created 2 awesome posters this month!"
- **Poster Gallery:** Show thumbnails of user's 2 posters
- **Body:** "Ready for more?"
- **Upgrade Card:**
  - "⭐ Upgrade to Pro"
  - Benefits: 20 posters/month, HD exports, No watermark, Background removal
  - Price: "$9.99/month"
  - CTA: "Upgrade Now" → Stripe Checkout
- **Alternative:** "Or wait until [Feb 1] for 2 more free posters"
- **Secondary Button:** "Maybe Later" → returns to dashboard

**Behavior:**
- Modal is NOT dismissible by ESC or clicking outside
- User must choose: Upgrade or Maybe Later
- "Maybe Later" returns to `/dashboard`

Use `UpgradePrompt` component (UI-SUB-001) inside modal.

#### Test Approach
- Test modal appears when quota reached
- Test modal shows user's poster thumbnails
- Test upgrade CTA links to Stripe Checkout
- Test "Maybe Later" returns to dashboard
- Verify modal is not dismissible by ESC/outside click
- Test next month date calculates correctly

#### Dependencies
- **Blocked by:** UI-SUB-001 (uses UpgradePrompt), UI-FND-003 (Zustand)
- **Blocks:** UI-SUB-003 (provides context for Stripe flow)

#### Suggested Labels
`frontend`, `design`

---

### Story UI-SUB-003: Stripe Checkout Integration

#### Summary
Integrate Stripe Checkout for Pro/Premium upgrades with success/cancel handling

#### Acceptance Criteria
- [ ] Stripe Checkout session created on upgrade click
- [ ] Redirects to Stripe-hosted checkout
- [ ] Success URL redirects back with confirmation
- [ ] Cancel URL returns to pricing page
- [ ] Handles session expiration
- [ ] Shows loading state during redirect

#### Technical Notes
Create Stripe Checkout integration:

**Frontend:**
- Install `@stripe/stripe-js`
- Create `/api/stripe/create-checkout-session` API route
- When user clicks "Upgrade Now":
  1. Call API to create Checkout session
  2. Show loading spinner
  3. Redirect to Stripe Checkout URL

**API Route (`apps/web/app/api/stripe/create-checkout-session/route.ts`):**
```typescript
POST /api/stripe/create-checkout-session
Body: { tier: 'pro' | 'premium', interval: 'month' | 'year' }
Response: { sessionId, url }
```

**Stripe Configuration:**
- Success URL: `/dashboard?upgrade=success`
- Cancel URL: `/pricing?upgrade=cancelled`
- Mode: 'subscription'
- Line items: Price ID for Pro ($9.99/month) or Premium ($29.99/month)

**Success Handling:**
- On `/dashboard?upgrade=success`:
  - Show celebration toast: "🎉 Welcome to Pro! Your upgrade is active."
  - Refresh user data (refetch `useUserStore`)

**Error Handling:**
- Session creation fails: Show error toast, stay on current page
- Stripe redirect fails: Show error message, "Try again" button

#### Test Approach
- Test "Upgrade Now" creates Stripe session
- Test redirect to Stripe Checkout page
- Test success redirect returns to dashboard with toast
- Test cancel redirect returns to pricing page
- Test session creation error shows error message
- Verify user subscription updated after success
- Test loading state during redirect

#### Dependencies
- **Blocked by:** UI-LND-002 (pricing page), UI-SUB-002 (quota modal)
- **Blocks:** None

#### Suggested Labels
`frontend`, `backend`, `api`

---

## Epic UI-ONB: Onboarding & First-Time UX

### Story UI-ONB-001: Welcome Splash Screen

#### Summary
Create welcome splash screen for first-time users with product overview and example posters

#### Acceptance Criteria
- [ ] Full-screen welcome overlay
- [ ] Product headline and benefits
- [ ] 3 example poster images
- [ ] Primary CTA: "Create My First Poster"
- [ ] Skip option: "Go to Dashboard"
- [ ] Shows only once (localStorage flag)

#### Technical Notes
Create `WelcomeSplash` component:

**Display Logic:**
- Check localStorage for `hasSeenWelcome` flag
- If `false` or missing, show splash on first dashboard visit
- Set flag to `true` after dismissing

**Content:**
- **Header:** "🥋 BJJ Poster Builder"
- **Headline:** "Create Tournament Posters in 3 Steps"
- **Example Posters:** 3 beautiful poster images (showcasing variety)
- **Benefits:**
  - ✓ No design skills needed
  - ✓ Professional quality
  - ✓ Share instantly
- **Primary CTA:** "Create My First Poster" → `/builder`
- **Skip Link:** "Already used it? Skip to Dashboard"

**Style:**
- Full-screen overlay (z-index: 100)
- Centered content (max-width: 600px)
- Auto-dismiss after 5 seconds if no interaction (optional)

**Behavior:**
- Clicking CTA or skip sets `hasSeenWelcome` flag
- Navigate to builder or dashboard accordingly

#### Test Approach
- Test splash shows on first visit
- Test "Create My First Poster" navigates to builder
- Test "Skip to Dashboard" navigates to dashboard
- Test splash doesn't show on subsequent visits
- Verify localStorage flag is set correctly
- Test responsive layout on mobile

#### Dependencies
- **Blocked by:** UI-FND-002 (shadcn/ui)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

### Story UI-ONB-002: Guided Tooltips in Builder

#### Summary
Add sequential tooltips to guide first-time users through poster creation flow

#### Acceptance Criteria
- [ ] Tooltip pointing to photo upload
- [ ] Tooltip pointing to template selector
- [ ] Tooltip pointing to generate button
- [ ] Tooltips appear sequentially
- [ ] Dismissible (X button or click outside)
- [ ] Auto-advance after 5 seconds
- [ ] Never shown again after first session

#### Technical Notes
Create `GuidedTooltips` component using a library like `react-joyride`:

**Tooltip Steps:**
1. **Photo Upload:** "👆 Tap here to replace with your photo. Take a photo or choose from library."
2. **Template Selector:** "🎨 Try different templates. Swipe to see more styles."
3. **Generate Button:** "⚡ Tap to create your poster. Takes about 15 seconds."

**Behavior:**
- Tooltips appear on first builder visit (check localStorage: `hasSeenBuilderTour`)
- Each tooltip highlights the target element with spotlight effect
- Auto-advance after 5 seconds or click "Next"
- "X" button dismisses entire tour
- After completing or dismissing, set `hasSeenBuilderTour: true`

**Pre-filled Sample Data:**
- On first visit, pre-fill form with sample data:
  - Photo: Generic BJJ athlete silhouette image
  - Name: "Your Name Here"
  - Belt: "Black Belt"
  - Template: "Classic" (pre-selected)
- This allows user to immediately generate a poster to see how it works

**Style:**
- Use shadcn/ui Tooltip component
- Athletic Brutalism styling (bold text, high contrast)
- Mobile-friendly (large touch targets)

#### Test Approach
- Test tooltips appear on first builder visit
- Test tooltips advance sequentially
- Test auto-advance after 5 seconds
- Test "X" button dismisses all tooltips
- Test tooltips don't appear on subsequent visits
- Verify sample data pre-fills correctly
- Test tooltip positioning on mobile

#### Dependencies
- **Blocked by:** All UI-BLD stories (needs complete builder to annotate)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

### Story UI-ONB-003: First Poster Celebration

#### Summary
Show celebration screen after user creates their first poster with sharing options

#### Acceptance Criteria
- [ ] Full-screen celebration overlay
- [ ] Shows generated poster
- [ ] Congratulatory message
- [ ] Download button (primary action)
- [ ] Social share buttons (Instagram, Facebook)
- [ ] Quota reminder (1 left for free users)
- [ ] Soft upsell to Pro
- [ ] "Go to Dashboard" link

#### Technical Notes
Create `FirstPosterCelebration` component:

**Trigger Logic:**
- Check if this is user's first poster: `useUserStore.postersThisMonth === 1`
- Show celebration modal after successful generation
- Set localStorage flag: `hasCreatedFirstPoster: true`

**Content:**
- **Header:** "🎉 Congratulations! 🎉"
- **Message:** "You created your first tournament poster!"
- **Poster Preview:** Large display of generated poster
- **Usage Reminder:** "You have 1 poster left this month (Free plan)"
- **Actions:**
  - Primary: "📥 Download & Share" button
  - Social: Instagram and Facebook share buttons
  - Upsell: "Want to create posters for your whole team? [See Pro Plans]"
  - Navigation: "Go to Dashboard" link

**Behavior:**
- Full-screen modal (non-dismissible initially)
- After download, show "Go to Dashboard" button
- Social share opens native share dialogs or web share API

**Upsell (for free users only):**
- "Want to create posters for your whole team?"
- "[See Pro Plans]" → `/pricing`

#### Test Approach
- Test celebration shows after first poster generation
- Test poster preview displays correctly
- Test download button triggers file download
- Test social share buttons open share dialogs
- Test "Go to Dashboard" navigates correctly
- Verify celebration doesn't show for subsequent posters
- Test upsell shows only for free users

#### Dependencies
- **Blocked by:** UI-BLD-006 (generates poster), UI-DSH-001 (dashboard navigation)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

## Epic UI-POL: Polish & Performance

### Story UI-POL-001: Loading States & Animations

#### Summary
Create engaging loading states for poster generation with rotating tips and progress tracking

#### Acceptance Criteria
- [ ] Loading screen during poster generation
- [ ] Animated progress bar (0-100%)
- [ ] Rotating feature tips every 5 seconds
- [ ] Estimated time display ("Usually takes 15-20s")
- [ ] Engaging animation (BJJ-themed)
- [ ] Cannot be dismissed during generation

#### Technical Notes
Create `GenerationLoadingScreen` component:

**Display:**
- Full-screen overlay (z-index: 1000)
- Centered content
- Cannot be dismissed (non-modal, no close button)

**Animation:**
- Custom BJJ-themed animation (e.g., animated athlete silhouette warming up)
- OR Lottie animation from LottieFiles

**Progress Bar:**
- Reads `usePosterBuilderStore.generationProgress` (0-100)
- Smooth transitions with CSS animations
- Color: Primary blue gradient

**Rotating Tips:**
- Array of 5-6 tips about Pro features:
  - "💡 Pro tip: Remove backgrounds for cleaner posters (Pro feature)"
  - "💡 Did you know? Pro users get HD 1080p exports"
  - "💡 Upgrade to Pro to remove watermarks"
  - "💡 Premium users can create unlimited posters"
  - "💡 Pro includes background removal for cleaner photos"
- Rotate every 5 seconds using `setInterval`

**Time Estimate:**
- Display: "Usually takes 15-20 seconds"
- Update after 20s: "Almost done! A few more seconds..."

**Trigger:**
- Show when `usePosterBuilderStore.isGenerating === true`
- Hide when generation completes (success or error)

#### Test Approach
- Test loading screen appears when generating
- Test progress bar updates (mock progress updates)
- Test tips rotate every 5 seconds
- Test time estimate displays correctly
- Test animation plays smoothly
- Verify screen cannot be dismissed during generation
- Test screen hides after generation completes

#### Dependencies
- **Blocked by:** UI-BLD-006 (generate button triggers this)
- **Blocks:** None

#### Suggested Labels
`frontend`, `design`

---

### Story UI-POL-002: Error Handling & Edge Cases

#### Summary
Implement comprehensive error handling with user-friendly messages for all failure scenarios

#### Acceptance Criteria
- [ ] Error handling for photo upload failures
- [ ] Error handling for generation failures
- [ ] Error handling for network failures
- [ ] User-friendly error messages (no technical jargon)
- [ ] Retry actions for recoverable errors
- [ ] Error tracking (analytics)

#### Technical Notes
Implement error handling across all UI-BLD and UI-DSH components:

**Photo Upload Errors:**
```typescript
// File too large (>10MB)
Error: "📸 Photo is too large. Try a smaller file or compress it."
Action: [Try Again] [Learn How to Compress]

// Invalid format
Error: "❌ We only support JPG, PNG, and HEIC photos."
Action: [Choose Different Photo]

// Upload failed (network)
Error: "📡 Upload failed. Check your connection and try again."
Action: [Retry Upload]
```

**Generation Errors:**
```typescript
// Timeout (>60s)
Error: "⏱️ This is taking longer than usual. We'll email you when ready!"
Action: [Go to Dashboard] [Try Different Template]

// API failure
Error: "😓 Something went wrong on our end. We've been notified."
Action: [Try Again] (doesn't count toward quota)

// Quota exceeded (edge case)
Error: "You've used all 2 posters this month. Upgrade or wait until [date]."
Action: [Upgrade to Pro] [View Pricing]
```

**Form Validation Errors:**
- Inline, real-time validation
- Red border + error text below field
- Examples:
  - Name empty: "Name is required"
  - Name too long: "Name must be 50 characters or less"
  - Photo missing: "Upload a photo to continue"

**Network/Offline Errors:**
- Offline banner: "📡 You're offline. Reconnect to generate."
- API unreachable: "Can't connect to server. Check your connection."

**Error Tracking:**
- Log all errors to analytics with context:
  ```typescript
  analytics.track('error_occurred', {
    errorType: 'photo_upload_failed',
    errorMessage: error.message,
    userId: user.id
  })
  ```

**Error Toast Component:**
- Create reusable `ErrorToast` component
- Auto-dismiss after 5 seconds or manual close
- Red background, white text, error icon

#### Test Approach
- Test photo upload errors display correctly
- Test generation timeout shows email message
- Test API failure doesn't count toward quota
- Test form validation errors appear inline
- Test offline banner shows when offline
- Test retry buttons trigger correct actions
- Verify error analytics events fire
- Test error toasts auto-dismiss

#### Dependencies
- **Blocked by:** All UI-BLD, UI-DSH stories (needs complete flows to test errors)
- **Blocks:** None

#### Suggested Labels
`frontend`, `testing`

---

### Story UI-POL-003: Accessibility & Performance Audit

#### Summary
Audit and fix accessibility issues and performance bottlenecks to meet WCAG 2.1 AA and Core Web Vitals

#### Acceptance Criteria
- [ ] WCAG 2.1 AA compliance (all pages)
- [ ] Lighthouse accessibility score >90
- [ ] LCP <2.5s (all pages)
- [ ] FID <100ms
- [ ] CLS <0.1
- [ ] Keyboard navigation works everywhere
- [ ] Screen reader tested (NVDA/VoiceOver)

#### Technical Notes
Run comprehensive audits and fix issues:

**Accessibility Audit:**
- Run axe DevTools on all pages
- Test keyboard navigation (Tab, Enter, ESC, Arrow keys)
- Test screen reader (NVDA on Windows, VoiceOver on Mac)

**Common Fixes:**
- Add ARIA labels to icon-only buttons
- Ensure focus indicators are visible (2px outline)
- Fix color contrast issues (minimum 4.5:1 for text)
- Add skip-to-content links
- Ensure modals trap focus
- Add alt text to all images
- Label form inputs properly (`htmlFor` + `id`)
- Add `aria-live` regions for dynamic content

**Performance Audit:**
- Run Lighthouse on all pages
- Optimize images (WebP format, lazy loading)
- Preload critical fonts (Archivo Black)
- Code-split routes (`dynamic()` imports)
- Minimize JavaScript bundle size
- Add skeleton loaders to prevent CLS

**Specific Optimizations:**
- Landing page: Preload hero image, defer non-critical scripts
- Builder: Lazy load preview modal, prefetch templates
- Dashboard: Virtualize poster grid if >20 items

**Testing:**
- Lighthouse CI integration (fail build if scores drop)
- Manual testing with screen readers
- Keyboard-only navigation testing

#### Test Approach
- Run Lighthouse on all pages (target >90 all categories)
- Test keyboard navigation through entire app
- Test with screen reader (announce all actions correctly)
- Measure Core Web Vitals in production (RUM)
- Fix all accessibility violations from axe DevTools
- Verify focus indicators visible on all interactive elements
- Test color contrast meets 4.5:1 ratio

#### Dependencies
- **Blocked by:** All previous stories (needs complete app to audit)
- **Blocks:** None

#### Suggested Labels
`frontend`, `testing`, `performance`, `accessibility`

---

## Label Distribution

### Labels by Category
- **frontend:** 26 stories (all stories involve frontend work)
- **setup:** 4 stories (UI-FND-001, UI-FND-002, UI-FND-003, UI-FND-004)
- **design:** 17 stories (UI-LND, UI-BLD, UI-DSH, UI-SUB, UI-ONB)
- **testing:** 4 stories (UI-FND-003, UI-FND-004, UI-POL-002, UI-POL-003)
- **backend:** 1 story (UI-SUB-003 - Stripe API integration)
- **api:** 1 story (UI-SUB-003 - Stripe Checkout)
- **performance:** 1 story (UI-POL-003)
- **accessibility:** 1 story (UI-POL-003)

### Blocking Relationships
- **No blockers:** UI-FND-001 (starting point)
- **Most blocked:** UI-POL-003 (blocked by all previous stories)
- **Most blocking:** UI-FND-002 (blocks 12 stories)

---

## Next Steps

After reviewing and confirming these stories:

1. Use `/ideate:upload` to create Linear issues
2. Assign to team members based on epic ownership
3. Set sprint milestones (Phases 1-7 as defined in plan)
4. Begin implementation with Phase 1 (Foundation)

---

## Linear Upload

**Uploaded:** 2026-01-05T18:42:00Z
**Parent Issue:** [ODE-57](https://linear.app/odell/issue/ODE-57) - Feature: UI/UX for BJJ Poster Builder Web App

### Upload Summary

- **Total Stories:** 26
- **Parent Issue:** ODE-57
- **Sub-Issues:** ODE-58 to ODE-83
- **Team:** Odell
- **Project:** BJJ Poster APP

### Story Mapping

| Story | Issue | Blocked By |
|-------|-------|------------|
| UI-FND-001: Next.js 14 Project Scaffolding | [ODE-58](https://linear.app/odell/issue/ODE-58) | - |
| UI-FND-002: shadcn/ui Component Library Setup | [ODE-59](https://linear.app/odell/issue/ODE-59) | ODE-58 |
| UI-FND-003: Zustand Store Setup | [ODE-60](https://linear.app/odell/issue/ODE-60) | ODE-58 |
| UI-FND-004: TanStack Query Setup | [ODE-61](https://linear.app/odell/issue/ODE-61) | ODE-58 |
| UI-LND-001: Landing Page Hero & CTA | [ODE-62](https://linear.app/odell/issue/ODE-62) | ODE-59 |
| UI-LND-002: Pricing Page | [ODE-63](https://linear.app/odell/issue/ODE-63) | ODE-59 |
| UI-LND-003: Auth Pages (Signup/Login) | [ODE-64](https://linear.app/odell/issue/ODE-64) | ODE-59 |
| UI-BLD-001: Builder Layout & Header | [ODE-65](https://linear.app/odell/issue/ODE-65) | ODE-59, ODE-60 |
| UI-BLD-002: Photo Upload Zone | [ODE-66](https://linear.app/odell/issue/ODE-66) | ODE-59, ODE-60 |
| UI-BLD-003: Template Selector | [ODE-67](https://linear.app/odell/issue/ODE-67) | ODE-59, ODE-61 |
| UI-BLD-004: Athlete Info Form Fields | [ODE-68](https://linear.app/odell/issue/ODE-68) | ODE-59, ODE-60 |
| UI-BLD-005: Tournament Info & Advanced Fields | [ODE-69](https://linear.app/odell/issue/ODE-69) | ODE-68 |
| UI-BLD-006: Generate Button & Preview Modal | [ODE-70](https://linear.app/odell/issue/ODE-70) | ODE-59, ODE-60 |
| UI-DSH-001: Dashboard Layout & Header | [ODE-71](https://linear.app/odell/issue/ODE-71) | ODE-59, ODE-60 |
| UI-DSH-002: Usage Card & Quota Display | [ODE-72](https://linear.app/odell/issue/ODE-72) | ODE-59, ODE-60 |
| UI-DSH-003: Poster Grid & Cards | [ODE-73](https://linear.app/odell/issue/ODE-73) | ODE-59, ODE-61 |
| UI-DSH-004: Filter, Sort, Empty States | [ODE-74](https://linear.app/odell/issue/ODE-74) | ODE-73 |
| UI-SUB-001: Upgrade Prompt Component | [ODE-75](https://linear.app/odell/issue/ODE-75) | ODE-59 |
| UI-SUB-002: Quota Limit Modal | [ODE-76](https://linear.app/odell/issue/ODE-76) | ODE-75, ODE-60 |
| UI-SUB-003: Stripe Checkout Integration | [ODE-77](https://linear.app/odell/issue/ODE-77) | ODE-63, ODE-76 |
| UI-ONB-001: Welcome Splash Screen | [ODE-78](https://linear.app/odell/issue/ODE-78) | ODE-59 |
| UI-ONB-002: Guided Tooltips in Builder | [ODE-79](https://linear.app/odell/issue/ODE-79) | ODE-65, ODE-66, ODE-67, ODE-68, ODE-69, ODE-70 |
| UI-ONB-003: First Poster Celebration | [ODE-80](https://linear.app/odell/issue/ODE-80) | ODE-70, ODE-71 |
| UI-POL-001: Loading States & Animations | [ODE-81](https://linear.app/odell/issue/ODE-81) | ODE-70 |
| UI-POL-002: Error Handling & Edge Cases | [ODE-82](https://linear.app/odell/issue/ODE-82) | ODE-65, ODE-66, ODE-67, ODE-68, ODE-69, ODE-70, ODE-71, ODE-72, ODE-73, ODE-74 |
| UI-POL-003: Accessibility & Performance Audit | [ODE-83](https://linear.app/odell/issue/ODE-83) | ODE-58 to ODE-82 (all previous stories) |

### Dependency Highlights

- **Foundation (ODE-58)** is the starting point with no blockers
- **shadcn/ui (ODE-59)** is the most critical dependency, blocking 12 other stories
- **Zustand (ODE-60)** blocks 8 stories related to state management
- **TanStack Query (ODE-61)** blocks 2 stories that fetch data
- **Final Audit (ODE-83)** is blocked by all 25 previous stories

### Implementation Phases

**Phase 1: Foundation (4 stories)** - ODE-58, ODE-59, ODE-60, ODE-61
**Phase 2: Landing & Marketing (3 stories)** - ODE-62, ODE-63, ODE-64
**Phase 3: Poster Builder Core (6 stories)** - ODE-65, ODE-66, ODE-67, ODE-68, ODE-69, ODE-70
**Phase 4: Dashboard (4 stories)** - ODE-71, ODE-72, ODE-73, ODE-74
**Phase 5: Subscriptions (3 stories)** - ODE-75, ODE-76, ODE-77
**Phase 6: Onboarding (3 stories)** - ODE-78, ODE-79, ODE-80
**Phase 7: Polish (3 stories)** - ODE-81, ODE-82, ODE-83

All issues have been successfully created in Linear with proper parent-child relationships and blocking dependencies.
