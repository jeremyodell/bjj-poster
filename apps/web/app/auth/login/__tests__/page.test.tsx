import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Login Page', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Page Structure', () => {
    it('renders the main heading', () => {
      render(<LoginPage />);
      expect(
        screen.getByRole('heading', { level: 1, name: /welcome back/i })
      ).toBeInTheDocument();
    });

    it('renders subheading text', () => {
      render(<LoginPage />);
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    it('renders the auth form', () => {
      render(<LoginPage />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('renders sign in button', () => {
      render(<LoginPage />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('redirects to home after successful login', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/');
        },
        { timeout: 3000 }
      );
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error for empty password', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('has link to signup page', () => {
      render(<LoginPage />);
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
        'href',
        '/auth/signup'
      );
    });

    it('has forgot password link', () => {
      render(<LoginPage />);
      expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
        'href',
        '/auth/forgot-password'
      );
    });
  });
});
