import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MobileNav } from '../mobile-nav';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock the user store
const mockResetUser = vi.fn();
const mockUseUserStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) => mockUseUserStore(selector),
}));

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 2,
        postersLimit: 5,
        resetUser: mockResetUser,
      })
    );
  });

  it('renders hamburger button', () => {
    render(<MobileNav />);

    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('opens sheet when hamburger clicked', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sheet contains logo', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByText('BJJ Poster')).toBeInTheDocument();
  });

  it('sheet contains quota badge', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/of/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('sheet contains menu items', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('navigates to settings and closes sheet', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    await user.click(screen.getByRole('button', { name: /settings/i }));

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('logs out and closes sheet', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    await user.click(screen.getByRole('button', { name: /log out/i }));

    expect(mockResetUser).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
