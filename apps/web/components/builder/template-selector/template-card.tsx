'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/types/api';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={cn(
        'group w-full rounded-lg text-left transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-gray-900',
        isSelected && 'ring-2 ring-primary-500'
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-gray-700">
        <Image
          src={template.thumbnailUrl}
          alt={template.name}
          fill
          className="object-cover"
        />
        {isSelected && (
          <div
            data-testid="checkmark-icon"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500"
          >
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <div className="rounded-b-lg bg-gray-800 p-3">
        <p className="text-sm font-medium text-white">{template.name}</p>
      </div>
    </button>
  );
}
