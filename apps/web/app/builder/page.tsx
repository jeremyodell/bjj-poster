'use client';

import { useMemo } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { PosterBuilderForm } from '@/components/builder';
import { PageTransition, motion } from '@/components/ui/motion';
import { QuotaLimitModal, useQuotaGate } from '@/components/quota';
import { useUserStore } from '@/lib/stores';
import { easings } from '@/lib/animations';
import type { Poster } from '@/lib/types/api';

export default function BuilderPage(): JSX.Element {
  const { showModal, handleUpgrade, handleMaybeLater } = useQuotaGate();
  const postersThisMonth = useUserStore((state) => state.postersThisMonth);

  // Generate mock posters based on usage count for the modal display
  // TODO: Replace with actual poster fetch from API when available
  const mockPosters: Poster[] = useMemo(() => {
    return Array.from({ length: postersThisMonth }, (_, i) => ({
      id: `mock-${i}`,
      templateId: 'template-1',
      createdAt: new Date().toISOString(),
      thumbnailUrl: '/images/examples/poster-1.svg',
      athleteName: 'Champion',
      tournament: 'Tournament',
      beltRank: 'blue',
      status: 'completed' as const,
    }));
  }, [postersThisMonth]);

  return (
    <PageTransition>
      {/* Quota Limit Modal - blocks entire page when quota exceeded */}
      <QuotaLimitModal
        open={showModal}
        posters={mockPosters}
        onUpgrade={handleUpgrade}
        onMaybeLater={handleMaybeLater}
      />

      <div className="relative min-h-screen overflow-hidden">
        {/* Background atmospheric effects - creative workspace feel */}
        <div className="pointer-events-none fixed inset-0">
          {/* Top-left gold spotlight - like arena lighting on the workspace */}
          <div className="absolute -left-20 -top-20 h-[600px] w-[600px] bg-gradient-radial from-gold-500/8 via-gold-500/3 to-transparent" />

          {/* Bottom-right mat red glow - adds warmth */}
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-mat-500/5 blur-[100px]" />

          {/* Subtle diagonal light beam */}
          <div className="absolute -right-1/4 top-0 h-full w-1/2 rotate-12 bg-gradient-to-b from-gold-500/[0.02] via-transparent to-transparent" />

          {/* Fine grain texture */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNCIvPjwvc3ZnPg==')] opacity-60" />
        </div>

        <main id="main-content" className="relative z-10 px-4 py-8 md:px-8 md:py-12">
          {/* Page Header */}
          <div className="mb-10 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: easings.elastic }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-3.5 w-3.5 text-gold-500" />
              </motion.div>
              <span className="text-xs font-medium text-gold-400">Poster Builder</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: easings.easeOut }}
              className="font-display text-4xl tracking-wide text-white md:text-5xl"
            >
              CREATE YOUR{' '}
              <span className="relative inline-block">
                <span className="text-gradient-gold">LEGACY</span>
                {/* Trophy icon accent */}
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.4, ease: easings.elastic }}
                  className="absolute -right-8 -top-2 text-gold-500"
                >
                  <Trophy className="h-5 w-5" aria-hidden="true" />
                </motion.span>
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: easings.easeOut }}
              className="mt-3 text-lg text-surface-400"
            >
              Forge your championship poster. Upload your photo, customize the details, and immortalize your achievement.
            </motion.p>

            {/* Decorative line accent */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 h-[2px] w-32 origin-left bg-gradient-to-r from-mat-500 via-gold-500/50 to-transparent"
            />
          </div>

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: easings.easeOut }}
            className="relative"
          >
            <PosterBuilderForm />
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
}
