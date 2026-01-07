import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateSelector } from '../template-selector';

// Mock the hooks
vi.mock('@/lib/hooks', () => ({
  useTemplates: vi.fn(),
}));

vi.mock('@/lib/stores/poster-builder-store', () => ({
  usePosterBuilderStore: vi.fn(),
}));

import { useTemplates } from '@/lib/hooks';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';

const mockTemplates = [
  { id: 'tpl-001', name: 'Classic', category: 'tournament', thumbnailUrl: '/1.png' },
  { id: 'tpl-002', name: 'Modern', category: 'tournament', thumbnailUrl: '/2.png' },
  { id: 'tpl-003', name: 'Bold', category: 'competition', thumbnailUrl: '/3.png' },
  { id: 'tpl-004', name: 'Kids', category: 'kids', thumbnailUrl: '/4.png' },
];

function TestWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('TemplateSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePosterBuilderStore).mockReturnValue({
      selectedTemplateId: null,
      setTemplate: vi.fn(),
    });
  });

  it('shows loading skeletons when loading', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    const skeletons = screen.getAllByTestId('template-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error message and retry button when error', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls refetch when retry button clicked', async () => {
    const refetch = vi.fn();
    vi.mocked(useTemplates).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch,
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('displays recommended section with first 3 templates', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    expect(screen.getByText('Recommended for you')).toBeInTheDocument();
    expect(screen.getByText('Classic')).toBeInTheDocument();
    expect(screen.getByText('Modern')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });

  it('shows browse all button that expands to show all templates', async () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    const browseButton = screen.getByRole('button', { name: /browse all templates/i });
    expect(browseButton).toBeInTheDocument();

    // Fourth template should not be visible initially (only in browse all)
    expect(screen.queryByText('Kids')).not.toBeInTheDocument();

    // Click to expand
    await userEvent.click(browseButton);

    // Now all templates should be visible
    expect(screen.getByText('Kids')).toBeInTheDocument();
  });

  it('collapses browse all section when clicked again', async () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    const browseButton = screen.getByRole('button', { name: /browse all templates/i });

    // Expand
    await userEvent.click(browseButton);
    expect(screen.getByText('Kids')).toBeInTheDocument();

    // Collapse
    await userEvent.click(browseButton);
    expect(screen.queryByText('Kids')).not.toBeInTheDocument();
  });

  it('filters templates by category when filter selected', async () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    // Expand browse all
    await userEvent.click(screen.getByRole('button', { name: /browse all templates/i }));

    // All templates visible
    expect(screen.getByText('Kids')).toBeInTheDocument();
    expect(screen.getAllByText('Classic').length).toBeGreaterThan(0);

    // Click tournament filter
    await userEvent.click(screen.getByRole('button', { name: /tournament/i }));

    // Only tournament templates visible in browse all
    expect(screen.queryByText('Kids')).not.toBeInTheDocument();
  });

  it('shows all templates when All filter selected', async () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    // Expand and filter
    await userEvent.click(screen.getByRole('button', { name: /browse all templates/i }));
    await userEvent.click(screen.getByRole('button', { name: /tournament/i }));

    // Click All to reset
    await userEvent.click(screen.getByRole('button', { name: /^all$/i }));

    // All templates visible again
    expect(screen.getByText('Kids')).toBeInTheDocument();
  });

  it('updates store when template selected', async () => {
    const setTemplate = vi.fn();
    vi.mocked(usePosterBuilderStore).mockReturnValue({
      selectedTemplateId: null,
      setTemplate,
    });

    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    await userEvent.click(screen.getByText('Classic'));
    expect(setTemplate).toHaveBeenCalledWith('tpl-001');
  });

  it('shows selected template with visual indicator', () => {
    vi.mocked(usePosterBuilderStore).mockReturnValue({
      selectedTemplateId: 'tpl-001',
      setTemplate: vi.fn(),
    });

    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    expect(screen.getByTestId('checkmark-icon')).toBeInTheDocument();
  });

  it('has proper ARIA attributes on browse all toggle', async () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    const browseButton = screen.getByRole('button', { name: /browse all templates/i });

    // Initially collapsed
    expect(browseButton).toHaveAttribute('aria-expanded', 'false');
    expect(browseButton).toHaveAttribute('aria-controls', 'browse-all-section');

    // Expand
    await userEvent.click(browseButton);
    expect(browseButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('has proper ARIA attributes on category filters', async () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: TestWrapper });

    // Expand browse all
    await userEvent.click(screen.getByRole('button', { name: /browse all templates/i }));

    // All button should be pressed by default
    const allButton = screen.getByRole('button', { name: /^all$/i });
    expect(allButton).toHaveAttribute('aria-pressed', 'true');

    // Click tournament filter
    const tournamentButton = screen.getByRole('button', { name: /tournament/i });
    await userEvent.click(tournamentButton);

    // Tournament should now be pressed, All should not
    expect(tournamentButton).toHaveAttribute('aria-pressed', 'true');
    expect(allButton).toHaveAttribute('aria-pressed', 'false');
  });
});
