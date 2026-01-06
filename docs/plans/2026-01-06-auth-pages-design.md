# Auth Pages Design (ODE-64)

## Overview

Build signup and login pages with form validation, password toggle, and loading states.

## Decisions

- **Form library**: React Hook Form + Zod
- **Layout**: Centered card on dark background (matches site style)
- **Submit behavior**: Mock success flow (1.5s loading, redirect to home)

## File Structure

```
apps/web/
├── app/auth/
│   ├── signup/page.tsx       # Signup page
│   ├── login/page.tsx        # Login page
│   └── layout.tsx            # Shared auth layout (centered card)
├── components/auth/
│   ├── auth-form.tsx         # Shared form component
│   └── password-input.tsx    # Password field with visibility toggle
└── lib/validations/
    └── auth.ts               # Zod schemas
```

## Dependencies

**New:**
- `react-hook-form`
- `@hookform/resolvers`

**Existing:**
- `Button`, `Input`, `Card` from `components/ui`
- `lucide-react` (Eye/EyeOff icons)

## Component Design

### AuthForm

Props: `mode: 'login' | 'signup'`, `onSubmit: (data) => Promise<void>`

Features:
- Email input with validation
- Password input with visibility toggle
- Submit button with loading spinner
- Inline error messages (red text below fields)
- "Forgot password?" link (login mode only)
- Link to switch between login/signup

### PasswordInput

- Wraps base `Input` component
- Eye/EyeOff toggle button on right side
- Toggles between `type="password"` and `type="text"`
- Proper `aria-label` for accessibility

### Validation Schemas

```typescript
// loginSchema
email: z.string().email("Invalid email address")
password: z.string().min(1, "Password is required")

// signupSchema
email: z.string().email("Invalid email address")
password: z.string().min(8, "Password must be at least 8 characters")
```

## Page Layout

### Auth Layout

- Full screen `bg-primary-900`
- Centered card (`bg-primary-800`, max-w ~400px)
- Logo/app name at top linking to home

### Signup Page

- Heading: "Create your account"
- Subtext: "Start creating tournament posters"
- AuthForm (signup mode)
- On submit: 1.5s delay → redirect to `/`

### Login Page

- Heading: "Welcome back"
- Subtext: "Sign in to your account"
- AuthForm (login mode)
- "Forgot password?" link → `/auth/forgot-password`
- On submit: 1.5s delay → redirect to `/`

## Testing Strategy

### Test Files

- `app/auth/signup/__tests__/page.test.tsx`
- `app/auth/login/__tests__/page.test.tsx`
- `components/auth/__tests__/auth-form.test.tsx`
- `components/auth/__tests__/password-input.test.tsx`

### Test Cases

1. Invalid email shows error message
2. Short password shows error (signup: min 8 chars)
3. Empty fields show required errors
4. Error messages appear inline below fields
5. Password toggle changes input type and icon
6. Password toggle has correct aria-label
7. Submit button shows loading spinner
8. Submit button disabled during loading
9. "Forgot password" link present on login page
10. Auth mode switch links work
11. Form renders correctly at 375px viewport
12. Tab order is logical
13. Enter key submits form

## Out of Scope

- Actual authentication backend integration
- Forgot password page implementation
- Social login (Google, etc.)
