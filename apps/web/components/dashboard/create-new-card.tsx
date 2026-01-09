'use client';

import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';

export function CreateNewCard(): JSX.Element {
  return (
    <Link
      href="/builder"
      aria-label="Create new poster"
      className="group relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-surface-700 bg-surface-900/30 p-8 transition-all duration-300 hover:border-gold-500/50 hover:bg-surface-900/50"
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/0 to-gold-500/0 transition-all duration-500 group-hover:from-gold-500/5 group-hover:to-transparent" aria-hidden="true" />

      {/* Plus icon with animation */}
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-700 bg-surface-800/50 transition-all duration-300 group-hover:scale-110 group-hover:border-gold-500/30 group-hover:bg-gold-500/10">
        <Plus className="h-8 w-8 text-surface-500 transition-all duration-300 group-hover:text-gold-500" aria-hidden="true" />
      </div>

      {/* Text */}
      <h3 className="relative mb-2 font-display text-xl tracking-wide text-white transition-colors group-hover:text-gold-400">
        CREATE NEW POSTER
      </h3>
      <p className="relative text-center text-sm text-surface-500 transition-colors group-hover:text-surface-400">
        Design your championship-worthy poster
      </p>

      {/* Sparkles accent - decorative */}
      <Sparkles className="absolute right-4 top-4 h-4 w-4 text-surface-700 transition-all duration-300 group-hover:text-gold-500/50" aria-hidden="true" />
    </Link>
  );
}
