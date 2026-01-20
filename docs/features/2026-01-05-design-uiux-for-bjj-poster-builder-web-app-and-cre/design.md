# Design: UI/UX for BJJ Poster Builder Web App

**Date:** 2026-01-05
**Original idea:** Design UI/UX for BJJ Poster Builder web app and create detailed Linear stories for the Poster Creation epic (US-010 to US-016). Focus on: user flows from landing page through poster creation and download, component architecture with Next.js 14 + shadcn/ui, multi-step vs single-page builder UX, state management approach, and breaking into small implementable stories like the IMG epic format. Target: non-technical BJJ athletes, mobile-first, <5 min poster creation.

---

## Design Decisions Summary

### Core UX Approach
- **Builder Flow:** Hybrid Quick Start + Advanced (essential fields visible, optional details expandable)
- **Template Selection:** Smart Recommendation + Browse (3 recommended templates, expandable grid)
- **State Management:** Zustand for global state, TanStack Query for server state
- **Mobile Preview:** Floating preview button → Full-screen modal with thumbnail badge
- **Photo Upload:** Camera-first mobile UX (take photo or choose library) with background removal for Pro/Premium
- **Success Flow:** Share-first success screen with download, social sharing, and upgrade CTA
- **Dashboard:** Card-based layout with quick actions and usage indicators
- **Upgrade Prompts:** Value-first hybrid (gentle reminders → friendly blocking modal at limit)
- **Onboarding:** Quick start wizard with visual proof → builder with inline tooltips
- **Loading States:** Engaging animation with rotating tips during 15-20s generation

---

## Section 1: Architecture & User Flows

### High-Level Architecture

The BJJ Poster Builder frontend is a **Next.js 14 App Router** application with these core principles:
- **Mobile-first responsive design** using Tailwind CSS + shadcn/ui components
- **Zustand** for global state (poster builder, user session, quota tracking)
- **TanStack Query** for server state (templates, user data, poster history)
- **Progressive enhancement** - works without JS for critical paths (landing page, pricing)

### Primary User Flows

**Flow 1: New User → First Poster (Target: <3 minutes)**
```
Landing Page → Sign Up → Quick Start Wizard → Poster Builder →
Generation (20s) → Share-First Success → Dashboard
```

**Flow 2: Returning User → Quick Poster (Target: <2 minutes)**
```
Dashboard → "Create New" → Builder (pre-filled from last) →
Generate → Share → Back to Dashboard
```

**Flow 3: Free User Hits Limit → Upgrade**
```
Dashboard → "Create New" → Friendly Blocking Modal →
Pricing Page → Stripe Checkout → Success → Builder (Pro unlocked)
```

### App Structure
```
/                   Landing page (marketing)
/auth/signup        Sign up flow
/auth/login         Login
/onboarding         Quick start wizard (first-time users)
/builder            Poster creation (main app)
/dashboard          Poster history
/pricing            Subscription plans
/poster/[id]        View/share individual poster
/settings           Account & subscription management
```

---

## Section 2: Component Architecture

### Core Component Breakdown

**Poster Builder** (`/builder` - most complex page)
```
<BuilderLayout>
  ├─ <BuilderHeader>              # Logo, user menu, quota badge, "Preview" button
  ├─ <PosterForm>                 # Main form container
  │   ├─ <PhotoUploadZone>        # Camera/library upload + crop
  │   ├─ <TemplateSelector>       # Smart recommendations + browse
  │   ├─ <AthleteInfoFields>      # Name, belt, team (always visible)
  │   ├─ <TournamentInfoFields>   # Tournament, date, location
  │   └─ <AdvancedOptions>        # Collapsible section (text styling, etc.)
  ├─ <GenerateButton>             # Sticky bottom button (mobile)
  └─ <PreviewModal>               # Full-screen poster preview (triggered by floating button)
```

**Dashboard** (`/dashboard`)
```
<DashboardLayout>
  ├─ <DashboardHeader>            # Welcome, quota usage, "Create New" CTA
  ├─ <UsageCard>                  # "2 of 2 posters used" with upgrade CTA (free users)
  ├─ <CreateNewCard>              # Prominent "Create Poster" card
  ├─ <PosterGrid>                 # Card-based poster history
  │   └─ <PosterCard>[]           # Individual poster with actions
  └─ <FilterSort>                 # Filter/sort controls
```

**Shared UI Components** (shadcn/ui based)
- `<Button>` - Primary, secondary, ghost variants
- `<Card>` - Container for posters, forms, modals
- `<Input>`, `<Select>`, `<Textarea>` - Form controls
- `<Modal>`, `<Sheet>`, `<Tooltip>` - Overlays
- `<UpgradePrompt>` - Reusable upgrade CTA component

---

## Section 3: State Management with Zustand

### Zustand Store Structure

**`usePosterBuilderStore`** - Manages poster creation state
```typescript
interface PosterBuilderState {
  // Form data
  athletePhoto: File | null;
  athleteName: string;
  beltRank: string;
  team: string;
  tournament: string;
  date: string;
  location: string;

  // Template selection
  selectedTemplateId: string | null;

  // UI state
  isGenerating: boolean;
  generationProgress: number;
  showAdvancedOptions: boolean;
  showPreview: boolean;

  // Actions
  setPhoto: (file: File) => void;
  setField: (field: string, value: string) => void;
  setTemplate: (templateId: string) => void;
  generatePoster: () => Promise<void>;
  reset: () => void;
}
```

**`useUserStore`** - User session and quota
```typescript
interface UserState {
  user: User | null;
  subscriptionTier: 'free' | 'pro' | 'premium';
  postersThisMonth: number;
  postersLimit: number;
  canCreatePoster: boolean;

  // Actions
  checkQuota: () => boolean;
  incrementUsage: () => void;
}
```

**TanStack Query for Server State**
- `useTemplates()` - Fetch all templates with caching
- `usePosterHistory()` - Fetch user's posters
- `useGeneratePoster()` - Mutation for poster creation
- `usePosterStatus(posterId)` - Poll for generation status

---

## Section 4: Key Screen Designs

### Landing Page (`/`)

**Hero Section**
- **Headline:** "Create Tournament Posters in Minutes" (H1, 48px, bold)
- **Subheadline:** "Professional BJJ posters for athletes. No design skills needed." (24px)
- **3 Example Posters** displayed side-by-side (visual proof)
- **CTA:** Large "Create Free Poster" button (primary, leads to /auth/signup)
- **Social Proof:** "Join 1,000+ BJJ athletes" badge

**How It Works** (3 steps with icons)
1. 📸 Upload Photo → 🎨 Choose Template → ⚡ Download & Share

**Pricing Teaser**
- Simple comparison: Free (2/month, watermarked) vs Pro ($9.99, 20/month, HD)
- "View Full Pricing" link

**Footer**
- About, Contact, Terms, Privacy, Instagram/Facebook links

### Builder Page (`/builder`)

**Mobile Layout (375px)**
```
┌─────────────────────────────┐
│ [Logo]    [2/2 used] [Menu] │ ← Header
├─────────────────────────────┤
│                             │
│  📷 Upload Photo            │ ← Photo Upload (large touch target)
│  [Tap to take photo]        │
│  or choose from library     │
│                             │
├─────────────────────────────┤
│  ⭐ Recommended Templates   │
│  [T1] [T2] [T3]            │ ← 3 recommended templates
│  Browse all templates ▼     │
├─────────────────────────────┤
│  Name: [________________]   │
│  Belt: [▼ Select belt]      │ ← Always visible fields
│  Team: [________________]   │
│  Tournament: [___________]  │
│                             │
│  ➕ Add more details        │ ← Expandable section
├─────────────────────────────┤
│                             │
│  [Generate Poster] 🎨       │ ← Sticky bottom button
└─────────────────────────────┘
│ [Preview] 👁️               │ ← Floating button (bottom-right)
```

**Desktop Layout (1440px)**
- Similar but 2-column: Form on left (60%), Live preview on right (40%)
- Preview updates in real-time (debounced 500ms)

---

## Section 5: Dashboard & Success Screens

### Dashboard (`/dashboard`)

**Mobile Layout**
```
┌─────────────────────────────┐
│ Welcome back, João! 👋      │
│ 2 of 2 posters used         │ ← Usage indicator
│ [Upgrade to Pro →]          │ ← CTA for free users
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │   ➕ Create New Poster  │ │ ← Primary CTA card
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Your Posters                │
│ [Filter ▼] [Sort ▼]         │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [Poster Thumbnail]      │ │
│ │ Worlds 2025             │ │
│ │ Black Belt • Jan 5      │ │ ← Poster card
│ │ 📥 💬 📋                 │ │ ← Download/Share/Duplicate
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [Poster Thumbnail]      │ │
│ │ Pan Ams 2024            │ │
│ │ Brown Belt • Dec 10     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Success Screen (After Generation)

**Full-Screen Celebration**
```
┌─────────────────────────────┐
│         ✨ 🎉 ✨            │
│                             │
│   [Generated Poster]        │ ← Large preview
│                             │
│   Poster Created!           │
│                             │
│   [📥 Download HD]          │ ← Primary action
│                             │
│   Share:                    │
│   [📷 Instagram] [👍 FB]   │ ← Social share buttons
│                             │
│   [View in Dashboard]       │
│                             │
│   ────────────────          │
│   🔓 Remove watermark       │ ← Upgrade CTA (free users)
│   Upgrade to Pro - $9.99/mo│
└─────────────────────────────┘
```

### Loading Screen (During Generation)

```
┌─────────────────────────────┐
│                             │
│   [Animated BJJ athlete]    │ ← Engaging animation
│   warming up...             │
│                             │
│   Creating your poster...   │
│                             │
│   [████████░░] 75%          │ ← Progress bar
│                             │
│   💡 Pro tip: Remove        │ ← Rotating tips
│   backgrounds for cleaner   │
│   posters (Pro feature)     │
│                             │
│   Usually takes 15-20s      │
└─────────────────────────────┘
```

---

## Section 6: Pricing Page & Upgrade Flow

### Pricing Page (`/pricing`)

**Three-Column Comparison Table**

```
┌──────────────────────────────────────────────┐
│  Choose Your Plan                            │
│  ○ Monthly    ○ Annual (Save 20%)           │ ← Toggle
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ FREE │  │ PRO  │  │PREMIUM│              │
│  │      │  │★ Most│  │       │              │
│  │      │  │Popular│  │       │              │
│  ├──────┤  ├──────┤  ├──────┤              │
│  │ $0   │  │$9.99 │  │$29.99 │              │
│  │/month│  │/month│  │/month │              │
│  ├──────┤  ├──────┤  ├──────┤              │
│  │      │  │      │  │       │              │
│  │ ✓ 2  │  │ ✓ 20 │  │ ✓ ∞  │ ← Posters/month
│  │posters│  │posters│  │posters│              │
│  │      │  │      │  │       │              │
│  │ ✓ 720p│  │ ✓ 1080p│ │ ✓ 4K │ ← Resolution
│  │      │  │  HD   │  │Ultra HD│              │
│  │      │  │      │  │       │              │
│  │ ✗ Water│ │ ✓ No │  │ ✓ No │ ← Watermark
│  │ -mark │  │water-│  │water- │              │
│  │      │  │ mark │  │ mark  │              │
│  │      │  │      │  │       │              │
│  │ ✗ BG  │  │ ✓ BG │  │ ✓ BG │ ← Background removal
│  │removal│  │removal│ │removal│              │
│  │      │  │      │  │       │              │
│  │      │  │      │  │ ✓ Custom│ ← Premium features
│  │      │  │      │  │ AI BG │              │
│  │      │  │      │  │       │              │
│  │ ✗ 7  │  │ ✓ 6mo│  │ ✓ ∞  │ ← Storage
│  │ days │  │storage│ │storage│              │
│  │      │  │      │  │       │              │
│  ├──────┤  ├──────┤  ├──────┤              │
│  │[Free]│  │[Try  │  │[Contact│              │
│  │      │  │ Pro]→│  │ Us]  │ ← CTAs
│  └──────┘  └──────┘  └──────┘              │
└──────────────────────────────────────────────┘
```

**Mobile:** Stacked cards, swipe between tiers

### Upgrade Modal (When Free User Hits Limit)

```
┌─────────────────────────────┐
│ 🎉 You've created 2 awesome │
│    posters this month!      │
│                             │
│ [Poster 1] [Poster 2]       │ ← Show their work
│                             │
│ Ready for more?             │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⭐ Upgrade to Pro       │ │
│ │                         │ │
│ │ • 20 posters/month      │ │
│ │ • HD exports (1080p)    │ │ ← Benefits
│ │ • No watermark          │ │
│ │ • Background removal    │ │
│ │                         │ │
│ │ $9.99/month             │ │
│ │                         │ │
│ │ [Upgrade Now →]         │ │ ← Stripe Checkout
│ └─────────────────────────┘ │
│                             │
│ Or wait until Feb 1         │ ← Soft alternative
│ for 2 more free posters     │
│                             │
│ [Maybe Later]               │
└─────────────────────────────┘
```

---

## Section 7: Onboarding Flow

### Quick Start Wizard (First-Time Users Only)

**Screen 1: Welcome Splash (5 seconds)**
```
┌─────────────────────────────┐
│                             │
│   🥋 BJJ Poster Builder     │
│                             │
│   Create Tournament         │
│   Posters in 3 Steps        │
│                             │
│   [Example] [Example]       │ ← 3 beautiful posters
│   [Example]                 │   (visual proof)
│                             │
│   ✓ No design skills needed │
│   ✓ Professional quality    │ ← Quick benefits
│   ✓ Share instantly         │
│                             │
│   [Create My First Poster]→ │ ← Primary CTA
│                             │
│   ───────────────           │
│   Already used it?          │
│   [Skip to Dashboard]       │ ← Skip option
└─────────────────────────────┘
```

**Screen 2: Builder with Guided Tooltips**

User lands in `/builder` with:
- **Pre-loaded sample photo** (generic BJJ athlete silhouette)
- **Pre-selected template** ("Classic" - most popular)
- **Sample data filled in:**
  - Name: "Your Name Here"
  - Belt: "Black Belt"
  - Tournament: "Your Tournament"

**Inline tooltips appear sequentially:**
```
Step 1 → Points to photo upload:
"👆 Tap here to replace with your photo
   Take a photo or choose from library"

Step 2 → Points to template selector:
"🎨 Try different templates
   Swipe to see more styles"

Step 3 → Points to Generate button:
"⚡ Tap to create your poster
   Takes about 15 seconds"
```

**Tooltips are:**
- Dismissible (X button)
- Auto-advance after 5 seconds
- Never shown again (stored in localStorage)

### Post-First-Poster Celebration

After their first successful poster generation:
```
┌─────────────────────────────┐
│   🎉 Congratulations! 🎉    │
│                             │
│   You created your first    │
│   tournament poster!        │
│                             │
│   [Their Generated Poster]  │
│                             │
│   You have 1 poster left    │
│   this month (Free plan)    │
│                             │
│   [Download & Share]        │
│                             │
│   Want to create posters    │
│   for your whole team?      │
│   [See Pro Plans]           │ ← Soft upsell
│                             │
│   [Go to Dashboard]         │
└─────────────────────────────┘
```

---

## Section 8: Error Handling & Edge Cases

### Error States & User-Friendly Messages

**Photo Upload Errors**
```
Error: File too large (>10MB)
Message: "📸 Photo is too large. Try a smaller file or compress it."
Action: [Try Again] [Learn How to Compress]

Error: Invalid format
Message: "❌ We only support JPG, PNG, and HEIC photos."
Action: [Choose Different Photo]

Error: Upload failed (network)
Message: "📡 Upload failed. Check your connection and try again."
Action: [Retry Upload]
```

**Generation Errors**
```
Error: Generation timeout (>60s)
Message: "⏱️ This is taking longer than usual. We'll email you when ready!"
Action: [Go to Dashboard] [Try Different Template]

Error: Bedrock API failure
Message: "😓 Something went wrong on our end. We've been notified."
Action: [Try Again] (doesn't count toward quota)

Error: Quota exceeded (shouldn't happen due to UI prevention)
Message: "You've used all 2 posters this month. Upgrade or wait until [date]."
Action: [Upgrade to Pro] [View Pricing]
```

**Form Validation (Inline, Real-Time)**
```
Field: Athlete Name
Error: Empty when generating
Display: Red border + "Name is required"

Field: Tournament
Error: Empty
Display: Yellow highlight + "Tournament name helps others find your poster"

Field: Photo
Error: Missing
Display: Pulsing upload zone + "Upload a photo to continue"
```

### Offline/Network Handling

**Offline Detector**
```
┌─────────────────────────────┐
│ 📡 You're offline           │ ← Banner at top
│ Reconnect to generate       │
└─────────────────────────────┘
```

**Actions Available Offline:**
- Fill out form (saved to localStorage)
- Browse templates (cached)
- View previously generated posters (cached)

**Actions Blocked:**
- Photo upload
- Poster generation
- Template fetch (if not cached)

### Empty States

**Dashboard (No Posters Yet)**
```
┌─────────────────────────────┐
│                             │
│   🎨                        │
│   No posters yet            │
│                             │
│   Create your first         │
│   tournament poster!        │
│                             │
│   [Create Poster →]         │
│                             │
└─────────────────────────────┘
```

**Template Loading Failed**
```
Message: "Couldn't load templates. Check your connection."
Action: [Retry] (meanwhile show 3 cached default templates)
```

---

## Section 9: Design System

### Aesthetic Direction: **"Athletic Brutalism"**

**Concept:** Strong, confident, no-nonsense design that matches the BJJ mindset. Clean lines, bold typography, high contrast, purposeful motion. Evokes the mat—disciplined, focused, powerful.

### Typography - Distinctive & Athletic

**Display/Headings (Tournament Names, Athlete Names):**
```css
--font-display: "Archivo Black", sans-serif
```
- **Why:** Ultra-bold, condensed, athletic without being tacky
- **Character:** Commanding presence, tournament-poster energy
- **Source:** Google Fonts (free)
- **Alternatives:** "Oswald" (more condensed), "Barlow Condensed" (technical)

**Body Text:**
```css
--font-body: "DM Sans", sans-serif
```
- **Why:** Geometric, clean, excellent readability, NOT overused like Inter
- **Character:** Modern but not sterile
- **Source:** Google Fonts (free)

**Accent (Belt Badges, Small UI):**
```css
--font-accent: "JetBrains Mono", monospace
```
- **Why:** Technical, precise, unexpected for a design app
- **Use:** Belt ranks, timestamps, quota counters
- **Character:** Adds edge and contrast

### Color Palette - Martial Arts Inspired

**Primary (Brand) - Deep Indigo to Electric Blue**
```
primary-900: #1a1f3a  (midnight mat)
primary-700: #2d3561  (gi indigo)
primary-500: #4361ee  (electric blue - main brand)
primary-300: #7c8fd9
primary-100: #d4ddf7
```
**Why:** Deeper, richer than generic tech blues. References traditional gi colors.

**Accent - Championship Gold**
```
accent-600: #d4af37  (olympic gold)
accent-500: #ffd700  (gold medal)
accent-400: #ffe55c
```
**Why:** Undeniable association with winning, excellence, belt progression.

**Semantic**
```
success:  #00c853  (vivid green - submission success!)
error:    #d32f2f  (strong red, not pink-red)
warning:  #ff8f00  (amber, visible but not alarming)
```

**Neutrals - High Contrast**
```
slate-950:  #0a0f1e  (almost black backgrounds - dark mode)
slate-900:  #121826  (card backgrounds - dark mode)
slate-50:   #f8fafc  (light mode background)
white:      #ffffff  (pure white for posters)
```

### Spacing System (Tailwind Default)

**Component Spacing**
```
Card Padding:     p-6 (24px)
Button Padding:   px-6 py-3 (24px × 12px)
Input Padding:    px-4 py-2 (16px × 8px)
Section Gap:      space-y-8 (32px)
Grid Gap:         gap-6 (24px)
```

### Component Styles (shadcn/ui Customization)

**Buttons**
```
Primary:    bg-primary-600 hover:bg-primary-700
            text-white rounded-lg px-6 py-3

Secondary:  bg-slate-100 hover:bg-slate-200
            text-slate-900 rounded-lg

Ghost:      bg-transparent hover:bg-slate-100
            text-slate-700
```

**Cards**
```
bg-white shadow-md rounded-xl p-6
border border-slate-200
```

**Inputs**
```
border-slate-300 rounded-lg px-4 py-2
focus:ring-2 focus:ring-primary-500
```

### Mobile Breakpoints
```
sm:  640px   (large phones)
md:  768px   (tablets)
lg:  1024px  (desktops)
xl:  1280px  (large desktops)
```

---

## Section 10: Mobile Navigation & Responsive Patterns

### Mobile Navigation (< 768px)

**Header (Sticky Top)**
```
┌─────────────────────────────┐
│ ≡  BJJ Poster    [2/2] 👤  │
│ Menu              ↑quota ↑user
└─────────────────────────────┘
```

**Hamburger Menu (Slide-in Drawer)**
```
┌─────────────────────────────┐
│ ← Close                     │
│                             │
│ 🏠 Dashboard                │
│ ✨ Create Poster            │
│ 💳 Upgrade to Pro           │ ← Highlighted for free users
│ ⚙️  Settings                │
│ 📚 Help                     │
│ 🚪 Log Out                  │
│                             │
│ ─────────────               │
│ Pro: $9.99/mo              │
│ [Try Free for 7 Days]       │
└─────────────────────────────┘
```

### Desktop Navigation (> 1024px)

**Top Nav Bar**
```
┌──────────────────────────────────────────────┐
│ 🥋 BJJ Poster Builder                       │
│                                              │
│ Dashboard | Create | Templates | Pricing    │ ← Main nav
│                                              │
│                     [2 of 2 used]  [Profile]│ ← Right side
└──────────────────────────────────────────────┘
```

### Responsive Breakpoints & Behavior

**Mobile (< 640px)**
- Single column layouts
- Stack all forms vertically
- Full-width buttons
- Bottom sheet for modals
- Floating action button for "Create"
- Template carousel (1 visible)
- Preview opens full-screen modal

**Tablet (640px - 1024px)**
- 2-column grid for poster cards
- Template grid (2 columns)
- Forms still single column (better for portrait)
- Modals are centered overlays (not full-screen)

**Desktop (> 1024px)**
- 3-column poster grid
- Builder: Form (60%) + Live Preview (40%) side-by-side
- Template grid (3-4 columns)
- Hover states active (not just touch)

### Touch Interactions (Mobile)

**Swipe Gestures**
- **Template carousel:** Swipe left/right to browse
- **Dashboard cards:** Swipe left reveals Delete action
- **Preview modal:** Swipe down to dismiss

**Tap Targets**
- Minimum 44×44px for all interactive elements
- Generous padding around buttons (16px minimum)
- Form inputs: 48px height minimum

**Pull-to-Refresh**
- Dashboard: Pull down to refresh poster list
- Show loading spinner during refresh

### Progressive Enhancement

**Core functionality works without JavaScript:**
- Landing page fully accessible
- Pricing page readable
- Forms submit (with page reload fallback)

**Enhanced with JavaScript:**
- Live preview updates
- Template carousel animations
- Instant validation feedback
- Optimistic UI updates

---

## Section 11: Accessibility & Performance

### Accessibility (WCAG 2.1 AA Compliance)

**Color Contrast**
- Text on backgrounds: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 against adjacent colors
- **Test:** Primary blue (#4361ee) on white = 4.8:1 ✓

**Keyboard Navigation**
- All interactive elements focusable with Tab
- Skip to main content link
- Focus indicators: 2px solid outline, visible against all backgrounds
- Modal traps: Focus locked inside until dismissed
- Escape key closes modals/sheets

**Screen Reader Support**
```jsx
// Example: Photo upload
<button
  aria-label="Upload athlete photo or take a photo with camera"
  aria-describedby="upload-instructions"
>
  📷 Add Photo
</button>
<div id="upload-instructions" className="sr-only">
  Tap to choose from library or take a new photo.
  Maximum file size 10MB. Supported formats: JPG, PNG, HEIC
</div>
```

**ARIA Labels**
- Loading states: `aria-live="polite"` announcements
- Progress bars: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Form validation: `aria-invalid`, `aria-describedby` for errors
- Modal dialogs: `role="dialog"`, `aria-modal="true"`

**Image Alt Text**
- Generated posters: "Tournament poster for [Athlete Name], [Belt Rank], [Tournament]"
- Template previews: "[Template Name] - [Style Description]"
- Decorative images: `alt=""` (empty, not missing)

**Form Accessibility**
- Labels associated with inputs (`htmlFor` + `id`)
- Required fields: `aria-required="true"` + visual indicator
- Error messages: Linked with `aria-describedby`
- Autocomplete attributes where appropriate

### Performance Targets

**Core Web Vitals**
- **LCP (Largest Contentful Paint):** < 2.5s
  - Optimize hero images on landing page
  - Preload critical fonts (Archivo Black)

- **FID (First Input Delay):** < 100ms
  - Minimize JavaScript on initial load
  - Code-split routes with Next.js dynamic imports

- **CLS (Cumulative Layout Shift):** < 0.1
  - Reserve space for images (width/height attributes)
  - Fixed header heights
  - Skeleton loaders for dynamic content

**Image Optimization**
- Next.js Image component for all images
- Template thumbnails: WebP format, 300×400px @ 80% quality
- Generated posters: Progressive JPEG for preview
- Lazy loading below the fold

**JavaScript Bundle Size**
- Initial bundle: < 100KB gzipped
- Route-based code splitting
- Dynamic imports for heavy components:
  ```jsx
  const PosterPreview = dynamic(() => import('./PosterPreview'))
  ```

**Caching Strategy**
- Templates: Cache-Control: public, max-age=86400 (24 hours)
- Generated posters: Cache-Control: public, max-age=31536000 (1 year, immutable)
- API responses: ETag headers for conditional requests

**Loading Performance**
- Skeleton screens while loading dashboard
- Optimistic UI updates (immediate feedback)
- Prefetch templates on builder page mount
- Background upload with progress indicator

---

## Section 12: Implementation Notes & Testing

### Component Library - shadcn/ui Setup

**Install shadcn/ui components:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input select textarea
npx shadcn-ui@latest add dialog sheet tooltip
npx shadcn-ui@latest add dropdown-menu avatar badge
```

**Customize theme in `tailwind.config.js`:**
```js
module.exports = {
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
}
```

### State Persistence

**LocalStorage Strategy**
```typescript
// Save draft poster while user works
usePosterBuilderStore.subscribe((state) => {
  localStorage.setItem('poster-draft', JSON.stringify({
    athleteName: state.athleteName,
    selectedTemplateId: state.selectedTemplateId,
    // ... other fields
  }));
});

// Restore on mount
useEffect(() => {
  const draft = localStorage.getItem('poster-draft');
  if (draft) {
    usePosterBuilderStore.getState().restoreDraft(JSON.parse(draft));
  }
}, []);
```

### Testing Strategy

**Unit Tests (Vitest + React Testing Library)**
- Form validation logic
- Zustand store actions
- Utility functions (quota checking, date formatting)

**Component Tests**
```typescript
// Example: PosterCard component
test('shows download button for completed posters', () => {
  render(<PosterCard poster={mockPoster} />);
  expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
});
```

**E2E Tests (Playwright)**
```typescript
// Critical user journey
test('create first poster flow', async ({ page }) => {
  await page.goto('/builder');
  await page.getByLabel('Upload photo').setInputFiles('athlete.jpg');
  await page.getByLabel('Athlete name').fill('João Silva');
  await page.getByRole('button', { name: /generate/i }).click();

  await expect(page.getByText(/poster created/i)).toBeVisible();
});
```

**Visual Regression (Chromatic or Percy)**
- Template previews
- Generated poster outputs
- Empty states, error states
- Mobile vs desktop layouts

### Analytics Events (PostHog/Mixpanel)

**Track key events:**
```typescript
// User actions
analytics.track('poster_generation_started', {
  templateId: template.id,
  userTier: user.subscriptionTier,
});

// Conversion events
analytics.track('upgrade_button_clicked', {
  source: 'quota_modal', // or 'pricing_page', 'watermark_cta'
  userPostersThisMonth: user.postersThisMonth,
});

// Feature usage
analytics.track('background_removal_used', {
  tier: user.subscriptionTier,
});
```

---

## Summary

This design creates a **mobile-first, conversion-optimized** poster builder that:
- Gets users to their first poster in <3 minutes
- Uses distinctive "Athletic Brutalism" design language
- Balances free tier value with clear upgrade incentives
- Handles errors gracefully for non-technical users
- Performs well on mobile networks
- Follows accessibility best practices

The hybrid approach (quick start + advanced options) combined with smart recommendations and engaging loading states creates a delightful experience that drives both usage and conversions.
