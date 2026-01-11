'use client';

import { WelcomeSection, CreateNewCard } from '@/components/dashboard';
import { UpgradeSuccessHandler } from '@/components/checkout';
import { WelcomeSplash } from '@/components/onboarding';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function DashboardPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <WelcomeSplash />
      <UpgradeSuccessHandler />
      <ErrorBoundary>
        <WelcomeSection />
      </ErrorBoundary>

      {/* Your Posters Section */}
      <section>
        <h2 className="mb-6 font-display text-2xl tracking-wide text-white">
          YOUR POSTERS
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Create New Card - Always first */}
          <CreateNewCard />

          {/* Poster cards will be rendered here by ODE-72 */}
        </div>
      </section>
    </main>
  );
}
