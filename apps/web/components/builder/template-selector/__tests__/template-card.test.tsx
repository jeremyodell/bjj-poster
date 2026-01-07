import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TemplateCard } from '../template-card';

const mockTemplate = {
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
    expect(button).toHaveClass('ring-2', 'ring-primary-500');
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
