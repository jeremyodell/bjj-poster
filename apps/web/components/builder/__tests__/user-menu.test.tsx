import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserMenu } from '../user-menu';

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

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows initial when user has name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { name: 'John Doe', email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('shows user icon when no name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { name: 'John', email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('navigates to settings when clicked', async () => {
    const user = userEvent.setup();
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { name: 'John', email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Settings'));

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('calls resetUser and redirects on logout', async () => {
    const user = userEvent.setup();
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { name: 'John', email: 'john@example.com' }, resetUser: mockResetUser })
    );

    render(<UserMenu />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Log out'));

    expect(mockResetUser).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
