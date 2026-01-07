# Builder Layout & Header Design

**Issue:** ODE-65 - UI-BLD-001: Builder Layout & Header
**Date:** 2026-01-06
**Status:** Approved

## Summary

Create poster builder layout with sticky header showing logo, quota badge, and user menu. Mobile-responsive with hamburger menu and slide-in drawer.

## Component Architecture

### File Structure

```
apps/web/app/builder/
├── layout.tsx              # Builder layout with header

apps/web/components/builder/
├── builder-header.tsx      # Sticky header component
├── quota-badge.tsx         # "X of Y used" with colored dot
├── user-menu.tsx           # Avatar dropdown (Settings, Logout)
├── mobile-nav.tsx          # Hamburger + Sheet drawer
└── index.ts                # Barrel exports
```

### Component Hierarchy

```
BuilderLayout
└── BuilderHeader
    ├── Logo (Link to /dashboard)
    ├── QuotaBadge (reads useUserStore)
    ├── UserMenu (desktop only, hidden <768px)
    └── MobileNav (visible <768px only)
        └── Sheet (slide-in drawer)
            ├── Logo
            ├── QuotaBadge
            └── Menu items (Settings, Logout)
```

## Component Specifications

### BuilderLayout

- Wraps all `/builder/*` routes
- Outer container: `min-h-screen bg-primary-950`
- Main content: `w-full` with no max-width constraint (full canvas)
- No padding on main - individual pages control their own spacing

### BuilderHeader

- Sticky at top with `z-50`
- Height: `h-16` (64px)
- Horizontal padding: `px-4 md:px-6`
- Default: solid `bg-primary-900` background
- On scroll (>10px): `bg-primary-900/80 backdrop-blur-md` with subtle shadow
- Transition: `transition-all duration-200`

**Desktop Layout (≥768px):**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                          [QuotaBadge]  [UserMenu]   │
└─────────────────────────────────────────────────────────────┘
```

**Mobile Layout (<768px):**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                        [Hamburger]  │
└─────────────────────────────────────────────────────────────┘
```

### QuotaBadge

- Reads from `useUserStore`: `postersThisMonth`, `postersLimit`
- Display: `[●] 2 of 5 used`
- Dot colors based on percentage:
  - Green (`bg-green-500`): <50% used
  - Yellow (`bg-yellow-500`): 50-80% used
  - Red (`bg-red-500`): ≥80% used
- Dot: `h-2 w-2 rounded-full`
- Text: `text-sm text-primary-300 font-body`
- Numbers: `text-white font-medium`

### UserMenu

- Reads from `useUserStore`: `user`
- Avatar shows first initial of name, or User icon as fallback
- Avatar: `h-8 w-8` with `bg-primary-700` fallback background
- Uses Shadcn DropdownMenu
- Menu items:
  - Settings → `/settings`
  - Log out (red text) → calls `resetUser()`, redirects to `/`

### MobileNav

- Trigger: Hamburger icon (`Menu`), ghost button, `md:hidden`
- Uses Shadcn Sheet with `side="right"`
- Width: `w-72` (288px)
- Dark theme: `bg-primary-900 border-primary-800`

**Drawer Content:**
```
┌────────────────────────────┐
│  [Logo]            [✕]     │
├────────────────────────────┤
│  [●] 2 of 5 used           │
├────────────────────────────┤
│  ⚙️  Settings              │
│  🚪 Log out                │
└────────────────────────────┘
```

## State Management

- Uses existing `useUserStore` for quota data and user info
- No new stores needed
- Scroll state tracked locally in BuilderHeader via useState + scroll listener

## Dependencies

All already installed:
- `lucide-react` for icons (Menu, X, User, Settings, LogOut)
- Shadcn components: Sheet, DropdownMenu, Avatar, Button

## Testing Approach

### Test Files

```
apps/web/components/builder/__tests__/
├── builder-header.test.tsx
├── quota-badge.test.tsx
├── user-menu.test.tsx
└── mobile-nav.test.tsx
```

### Test Cases

**QuotaBadge:**
- Renders correct count ("2 of 5 used")
- Green dot when <50% used
- Yellow dot when 50-80% used
- Red dot when ≥80% used

**UserMenu:**
- Shows initial when user has name
- Shows icon when no name
- Dropdown opens on click
- Settings navigates to /settings
- Logout calls resetUser and redirects

**MobileNav:**
- Hamburger button visible on mobile
- Sheet opens when hamburger clicked
- Sheet contains logo, quota, menu items
- Clicking menu item closes sheet

**BuilderHeader:**
- Logo links to /dashboard
- Desktop: shows quota badge and user menu
- Mobile: shows hamburger, hides quota/user menu
- Scroll behavior: adds blur class when scrolled

### Mocking Strategy

- Mock `useUserStore` with test data
- Mock `next/navigation` for router.push assertions
- Use `fireEvent.scroll` for scroll behavior tests
