import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PosterGridFilteredEmptyProps {
  onClear: () => void;
}

export function PosterGridFilteredEmpty({ onClear }: PosterGridFilteredEmptyProps): JSX.Element {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-700 bg-surface-900/30 p-8">
      <SearchX
        data-testid="filtered-empty-icon"
        className="mb-4 h-16 w-16 text-surface-600"
        aria-hidden="true"
      />

      <h3 className="mb-2 font-display text-xl tracking-wide text-white">
        No posters match your filters
      </h3>

      <p className="mb-6 text-center text-sm text-surface-500">
        Try adjusting your filter or sort options.
      </p>

      <Button onClick={onClear}>Clear filters</Button>
    </div>
  );
}
