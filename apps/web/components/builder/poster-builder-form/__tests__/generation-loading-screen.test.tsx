import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GenerationLoadingScreen } from '../generation-loading-screen';

describe('GenerationLoadingScreen', () => {
  it('renders loading screen with progress', () => {
    render(<GenerationLoadingScreen progress={50} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders belt animation icon', () => {
    render(<GenerationLoadingScreen progress={0} />);

    expect(screen.getByTestId('belt-animation')).toBeInTheDocument();
  });
});
