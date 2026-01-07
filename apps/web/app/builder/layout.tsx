import { BuilderHeader } from '@/components/builder';

interface BuilderLayoutProps {
  children: React.ReactNode;
}

export default function BuilderLayout({
  children,
}: BuilderLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-primary-950">
      <BuilderHeader />
      <main className="w-full">{children}</main>
    </div>
  );
}
