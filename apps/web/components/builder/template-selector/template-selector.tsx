'use client';

import { useState, useMemo } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useTemplates } from '@/lib/hooks';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TemplateSkeleton } from './template-skeleton';
import { TemplateCard } from './template-card';
import { TemplateGrid } from './template-grid';

export function TemplateSelector(): JSX.Element {
  const [isBrowseAllOpen, setIsBrowseAllOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: templates, isLoading, isError, refetch } = useTemplates();
  const { selectedTemplateId, setTemplate } = usePosterBuilderStore();

  // Memoize expensive computations to prevent unnecessary recalculations
  const recommendedTemplates = useMemo(
    () => templates?.slice(0, 3) ?? [],
    [templates]
  );

  const categories = useMemo(
    () => (templates ? [...new Set(templates.map((t) => t.category))] : []),
    [templates]
  );

  const filteredTemplates = useMemo(
    () =>
      selectedCategory
        ? templates?.filter((t) => t.category === selectedCategory) ?? []
        : templates ?? [],
    [templates, selectedCategory]
  );

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

  return (
    <div className="space-y-6">
      <section aria-labelledby="recommended-heading">
        <h3 id="recommended-heading" className="mb-4 text-lg font-semibold text-white">
          Recommended for you
        </h3>
        <TemplateGrid>
          {recommendedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={setTemplate}
              priority
            />
          ))}
        </TemplateGrid>
      </section>

      <section aria-labelledby="browse-all-heading">
        <h3 id="browse-all-heading" className="sr-only">
          Browse all templates
        </h3>
        <button
          type="button"
          onClick={() => setIsBrowseAllOpen(!isBrowseAllOpen)}
          aria-expanded={isBrowseAllOpen}
          aria-controls="browse-all-section"
          className="flex w-full items-center justify-between rounded-lg bg-gray-800 px-4 py-3 text-left text-white transition-colors hover:bg-gray-700"
        >
          <span className="font-medium">Browse all templates</span>
          {isBrowseAllOpen ? (
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          )}
        </button>

        {isBrowseAllOpen && (
          <div id="browse-all-section" className="mt-4 space-y-4">
            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                aria-pressed={selectedCategory === null}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                  selectedCategory === null
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                  className={cn(
                    'rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors',
                    selectedCategory === category
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <TemplateGrid>
              {filteredTemplates.map((template) => (
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
