'use client';

import { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useTemplates } from '@/lib/hooks';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';
import { Button } from '@/components/ui/button';
import { TemplateSkeleton } from './template-skeleton';
import { TemplateCard } from './template-card';
import { TemplateGrid } from './template-grid';

export function TemplateSelector(): JSX.Element {
  const [isBrowseAllOpen, setIsBrowseAllOpen] = useState(false);
  const { data: templates, isLoading, isError, refetch } = useTemplates();
  const { selectedTemplateId, setTemplate } = usePosterBuilderStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Recommended for you
          </h3>
          <TemplateGrid>
            <TemplateSkeleton count={3} />
          </TemplateGrid>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="mb-4 text-gray-400">Failed to load templates</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400">No templates available</p>
      </div>
    );
  }

  const recommendedTemplates = templates.slice(0, 3);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-4 text-lg font-semibold text-white">
          Recommended for you
        </h3>
        <TemplateGrid>
          {recommendedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={setTemplate}
            />
          ))}
        </TemplateGrid>
      </section>

      <section>
        <button
          type="button"
          onClick={() => setIsBrowseAllOpen(!isBrowseAllOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-gray-800 px-4 py-3 text-left text-white transition-colors hover:bg-gray-700"
        >
          <span className="font-medium">Browse all templates</span>
          {isBrowseAllOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        {isBrowseAllOpen && (
          <div className="mt-4">
            <TemplateGrid>
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplateId === template.id}
                  onSelect={setTemplate}
                />
              ))}
            </TemplateGrid>
          </div>
        )}
      </section>
    </div>
  );
}
