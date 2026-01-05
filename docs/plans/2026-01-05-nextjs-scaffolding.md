# Next.js 14 Project Scaffolding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Next.js 14 App Router project in `apps/web/` with TypeScript, Tailwind CSS, and design system tokens.

**Architecture:** Use `create-next-app@14` to generate baseline project, then customize TypeScript strict mode, Tailwind design tokens, Google Fonts, and ESLint/Prettier configuration.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS v3, ESLint, Prettier, pnpm

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `apps/web/` (entire directory via create-next-app)

**Step 1: Run create-next-app**

```bash
cd apps && pnpm create next-app@14 web --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm
```

When prompted:
- Would you like to use Turbopack? → No

**Step 2: Verify project created**

```bash
ls apps/web/
```

Expected: `app/`, `public/`, `next.config.ts`, `package.json`, `tailwind.config.ts`, `tsconfig.json`, etc.

**Step 3: Install dependencies from root**

```bash
cd /home/bahar/bjj-poster && pnpm install
```

**Step 4: Verify dev server starts**

```bash
cd apps/web && pnpm dev &
sleep 5
curl -s http://localhost:3000 | head -20
pkill -f "next dev"
```

Expected: HTML output containing Next.js content

**Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): initialize Next.js 14 project with App Router"
```

---

### Task 2: Configure TypeScript Strict Mode

**Files:**
- Modify: `apps/web/tsconfig.json`

**Step 1: Read current tsconfig**

Read `apps/web/tsconfig.json` to see current settings.

**Step 2: Update tsconfig with strict settings**

Replace the `compilerOptions` to include strict settings:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: Verify type-check passes**

```bash
cd apps/web && pnpm type-check
```

Expected: No errors (exit code 0)

**Step 4: Commit**

```bash
git add apps/web/tsconfig.json
git commit -m "feat(web): configure TypeScript strict mode"
```

---

### Task 3: Configure Tailwind Design Tokens

**Files:**
- Modify: `apps/web/tailwind.config.ts`

**Step 1: Read current tailwind config**

Read `apps/web/tailwind.config.ts` to see current settings.

**Step 2: Update tailwind config with design tokens**

Replace entire file with:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#1a1f3a',
          800: '#252b4a',
          700: '#2f365a',
          600: '#3a4269',
          500: '#4361ee',
          400: '#5a7bf0',
          300: '#7a95f3',
        },
        accent: {
          gold: '#d4af37',
          'gold-bright': '#ffd700',
        },
      },
      fontFamily: {
        display: ['var(--font-archivo-black)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
```

**Step 3: Verify build passes**

```bash
cd apps/web && pnpm build
```

Expected: Build completes successfully

**Step 4: Commit**

```bash
git add apps/web/tailwind.config.ts
git commit -m "feat(web): add Tailwind design tokens for colors and fonts"
```

---

### Task 4: Set Up Google Fonts

**Files:**
- Modify: `apps/web/app/layout.tsx`

**Step 1: Read current layout**

Read `apps/web/app/layout.tsx` to see current structure.

**Step 2: Update layout with Google Fonts**

Replace entire file with:

```tsx
import type { Metadata } from 'next'
import { Archivo_Black, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BJJ Poster Builder',
  description: 'Tournament poster generator for BJJ athletes',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
```

**Step 3: Verify type-check passes**

```bash
cd apps/web && pnpm type-check
```

Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "feat(web): add Google Fonts with Next.js font optimization"
```

---

### Task 5: Update Global CSS

**Files:**
- Modify: `apps/web/app/globals.css`

**Step 1: Read current globals.css**

Read `apps/web/app/globals.css` to see current content.

**Step 2: Replace with minimal Tailwind setup**

Replace entire file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 3: Verify build passes**

```bash
cd apps/web && pnpm build
```

Expected: Build completes successfully

**Step 4: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat(web): simplify global CSS to Tailwind directives"
```

---

### Task 6: Create Demo Home Page

**Files:**
- Modify: `apps/web/app/page.tsx`

**Step 1: Read current page**

Read `apps/web/app/page.tsx` to see current content.

**Step 2: Replace with demo page showing design tokens**

Replace entire file with:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-primary-900 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="font-display text-5xl text-white">
          BJJ Poster Builder
        </h1>

        <p className="font-body text-lg text-primary-300">
          Tournament poster generator for BJJ athletes
        </p>

        <div className="flex gap-4">
          <button className="rounded-lg bg-primary-500 px-6 py-3 font-body font-semibold text-white hover:bg-primary-400">
            Get Started
          </button>
          <button className="rounded-lg border-2 border-accent-gold px-6 py-3 font-body font-semibold text-accent-gold hover:bg-accent-gold hover:text-primary-900">
            Learn More
          </button>
        </div>

        <div className="rounded-lg bg-primary-800 p-6">
          <p className="font-mono text-sm text-accent-gold-bright">
            // Design tokens working correctly
          </p>
        </div>
      </div>
    </main>
  )
}
```

**Step 3: Verify type-check and build pass**

```bash
cd apps/web && pnpm type-check && pnpm build
```

Expected: Both commands succeed

**Step 4: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): add demo home page with design tokens"
```

---

### Task 7: Configure Prettier

**Files:**
- Create: `apps/web/.prettierrc`

**Step 1: Check if root has prettier config**

```bash
cat /home/bahar/bjj-poster/.prettierrc 2>/dev/null || echo "No root prettierrc"
```

**Step 2: Create prettier config**

Create `apps/web/.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**Step 3: Add prettier dev dependency**

```bash
cd apps/web && pnpm add -D prettier
```

**Step 4: Add format script to package.json**

Read `apps/web/package.json`, then add to scripts:
- `"format": "prettier --write ."`
- `"format:check": "prettier --check ."`

**Step 5: Run formatter**

```bash
cd apps/web && pnpm format
```

**Step 6: Commit**

```bash
git add apps/web/.prettierrc apps/web/package.json apps/web/pnpm-lock.yaml
git commit -m "feat(web): add Prettier configuration"
```

---

### Task 8: Create Utility Directories

**Files:**
- Create: `apps/web/components/.gitkeep`
- Create: `apps/web/lib/.gitkeep`

**Step 1: Create directories with gitkeep**

```bash
mkdir -p apps/web/components apps/web/lib
touch apps/web/components/.gitkeep apps/web/lib/.gitkeep
```

**Step 2: Commit**

```bash
git add apps/web/components/.gitkeep apps/web/lib/.gitkeep
git commit -m "feat(web): add components and lib directories"
```

---

### Task 9: Update README

**Files:**
- Create: `apps/web/README.md`

**Step 1: Create README**

Create `apps/web/README.md`:

```markdown
# BJJ Poster Builder - Web App

Next.js 14 frontend for the BJJ tournament poster generator.

## Setup

From the monorepo root:

```bash
pnpm install
pnpm dev
```

The web app runs at http://localhost:3000

## Development

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm type-check   # TypeScript check
pnpm format       # Format with Prettier
```

## Design Tokens

### Colors

- `primary-900` to `primary-300`: Indigo/blue scale
- `accent-gold`, `accent-gold-bright`: Gold accents

### Fonts

- `font-display`: Archivo Black (headings)
- `font-body`: DM Sans (body text)
- `font-mono`: JetBrains Mono (code)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v3
- ESLint + Prettier
```

**Step 2: Commit**

```bash
git add apps/web/README.md
git commit -m "docs(web): add README with setup instructions"
```

---

### Task 10: Final Verification

**Step 1: Run full build from root**

```bash
cd /home/bahar/bjj-poster && pnpm build
```

Expected: All packages build successfully

**Step 2: Run lint from root**

```bash
pnpm lint
```

Expected: No errors

**Step 3: Run type-check from root**

```bash
pnpm type-check
```

Expected: No errors

**Step 4: Start dev server and verify manually**

```bash
pnpm dev &
sleep 8
curl -s http://localhost:3000 | grep -o "BJJ Poster Builder" || echo "Check manually"
pkill -f "next dev" || true
```

**Step 5: Commit any remaining changes**

```bash
git status
# If any unstaged changes, add and commit
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] `pnpm dev` starts web app on port 3000
- [ ] `pnpm build` completes without errors
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] Custom colors render (bg-primary-900, text-accent-gold)
- [ ] Custom fonts load (check Network tab for Google Fonts)
- [ ] TypeScript strict mode catches type errors
