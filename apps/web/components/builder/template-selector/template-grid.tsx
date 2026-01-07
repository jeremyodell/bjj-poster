'use client';

import type { ReactNode } from 'react';

interface TemplateGridProps {
  children: ReactNode;
}

export function TemplateGrid({ children }: TemplateGridProps): JSX.Element {
  return (
    <div
      data-testid="template-grid"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {children}
    </div>
  );
}
