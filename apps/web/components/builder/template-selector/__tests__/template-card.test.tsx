import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateCard } from '../template-card';
import type { Template } from '@/lib/types/api';

// Mock the user store with setState support for zustand
const mockState = {
  subscriptionTier: 'free' as 'free' | 'pro' | 'premium',
};

const useUserStore = {
  setState: (newState: Partial<typeof mockState>) => {
    Object.assign(mockState, newState);
  },
  getState: () => mockState,
};

vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}));

const mockTemplate: Template = {
  id: 'tpl-001',
  name: 'Classic Tournament',
  category: 'tournament',
  thumbnailUrl: '/templates/classic.png',
};

describe('TemplateCard', () => {
  it('renders template name', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Classic Tournament')).toBeInTheDocument();
  });

  it('renders template thumbnail with alt text', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    const img = screen.getByRole('img', { name: 'Classic Tournament' });
    expect(img).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('tpl-001');
  });

  it('shows selected state with ring and checkmark when selected', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={true}
        onSelect={vi.fn()}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('ring-2', 'ring-gold-500');
    expect(screen.getByTestId('checkmark-icon')).toBeInTheDocument();
  });

  it('does not show checkmark when not selected', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByTestId('checkmark-icon')).not.toBeInTheDocument();
  });

  it('accepts priority prop for above-the-fold images', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={vi.fn()}
        priority
      />
    );

    // The image should render (priority is passed internally to Next Image)
    expect(screen.getByRole('img', { name: 'Classic Tournament' })).toBeInTheDocument();
  });
});

describe('premium template badges', () => {
  const proTemplate: Template = {
    id: 'pro-1',
    name: 'Pro Template',
    category: 'championship',
    thumbnailUrl: '/pro.jpg',
    tier: 'pro',
  };

  const premiumTemplate: Template = {
    id: 'premium-1',
    name: 'Premium Template',
    category: 'championship',
    thumbnailUrl: '/premium.jpg',
    tier: 'premium',
  };

  beforeEach(() => {
    useUserStore.setState({ subscriptionTier: 'free' });
  });

  it('shows PRO badge on pro tier templates', () => {
    render(<TemplateCard template={proTemplate} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('PRO')).toBeInTheDocument();
  });

  it('shows PREMIUM badge with crown on premium tier templates', () => {
    render(<TemplateCard template={premiumTemplate} isSelected={false} onSelect={vi.fn()} />);
    expect(screen.getByText('PREMIUM')).toBeInTheDocument();
    expect(screen.getByTestId('premium-crown-icon')).toBeInTheDocument();
  });

  it('shows upgrade modal when free user clicks pro template', async () => {
    const onSelect = vi.fn();
    render(<TemplateCard template={proTemplate} isSelected={false} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
  });

  it('allows pro user to select pro template normally', async () => {
    useUserStore.setState({ subscriptionTier: 'pro' });
    const onSelect = vi.fn();
    render(<TemplateCard template={proTemplate} isSelected={false} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith('pro-1');
  });
});
