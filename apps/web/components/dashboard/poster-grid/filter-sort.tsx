import {
  isValidFilterOption,
  isValidSortOption,
  type FilterOption,
  type SortOption,
} from './filter-sort-utils';

interface FilterSortProps {
  filter: FilterOption;
  sort: SortOption;
  onFilterChange: (filter: FilterOption) => void;
  onSortChange: (sort: SortOption) => void;
  onClear: () => void;
}

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'recent', label: 'Recent' },
  { value: 'white', label: 'White Belt' },
  { value: 'blue', label: 'Blue Belt' },
  { value: 'purple', label: 'Purple Belt' },
  { value: 'brown', label: 'Brown Belt' },
  { value: 'black', label: 'Black Belt' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'a-z', label: 'A-Z' },
];

export function FilterSort({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onClear,
}: FilterSortProps): JSX.Element {
  const hasActiveFilters = filter !== 'all' || sort !== 'newest';

  const selectClassName =
    'rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value;
    if (isValidFilterOption(value)) {
      onFilterChange(value);
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value;
    if (isValidSortOption(value)) {
      onSortChange(value);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm text-surface-400">Filter</span>
          <select
            value={filter}
            onChange={handleFilterChange}
            className={selectClassName}
            aria-label="Filter"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm text-surface-400">Sort</span>
          <select
            value={sort}
            onChange={handleSortChange}
            className={selectClassName}
            aria-label="Sort"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-brand-400 hover:text-brand-300 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
