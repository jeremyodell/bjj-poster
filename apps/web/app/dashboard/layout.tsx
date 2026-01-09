import { DashboardHeader } from '@/components/dashboard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps): JSX.Element {
  return (
    <div className="relative min-h-screen bg-surface-950">
      {/* Subtle background gradient */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gold-500/[0.02] via-transparent to-transparent" />

      {/* Grain texture */}
      <div className="grain pointer-events-none fixed inset-0" />

      <DashboardHeader />
      <main className="relative w-full">{children}</main>
    </div>
  );
}
