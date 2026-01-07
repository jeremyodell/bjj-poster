import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignupPage from '../page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Signup Page', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Page Structure', () => {
    it('renders the main heading', () => {
      render(<SignupPage />);
      expect(
        screen.getByRole('heading', { level: 1, name: /create your account/i })
      ).toBeInTheDocument();
    });

    it('renders subheading text', () => {
      render(<SignupPage />);
      expect(screen.getByText(/start creating tournament posters/i)).toBeInTheDocument();
    });

    it('renders the auth form', () => {
      render(<SignupPage />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('renders create account button', () => {
      render(<SignupPage />);
      expect(
        screen.getByRole('button', { name: /create account/i })
      ).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('redirects to home after successful signup', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'Password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/');
        },
        { timeout: 3000 }
      );
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'Password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(
        screen.getByRole('button', { name: /creating account/i })
      ).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error for password less than 8 characters', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'short');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('has link to login page', () => {
      render(<SignupPage />);
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
        'href',
        '/auth/login'
      );
    });
  });

  describe('Mobile Layout', () => {
    it('renders form at 375px viewport', () => {
      // Set viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      window.dispatchEvent(new Event('resize'));

      render(<SignupPage />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });
});
