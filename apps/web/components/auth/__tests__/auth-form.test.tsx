import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthForm } from '../auth-form';

describe('AuthForm', () => {
  describe('Login Mode', () => {
    it('renders email and password fields', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('renders sign in button', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
        'href',
        '/auth/forgot-password'
      );
    });

    it('renders link to signup page', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
        'href',
        '/auth/signup'
      );
    });

    it('shows error for empty email on submit', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('does not submit with invalid email format', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<AuthForm mode="login" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Email'), 'invalid-email');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Form should not submit with invalid email
      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });

    it('shows error for empty password', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('calls onSubmit with form data when valid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AuthForm mode="login" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Signup Mode', () => {
    it('renders create account button', () => {
      render(<AuthForm mode="signup" onSubmit={vi.fn()} />);
      expect(
        screen.getByRole('button', { name: /create account/i })
      ).toBeInTheDocument();
    });

    it('does not render forgot password link', () => {
      render(<AuthForm mode="signup" onSubmit={vi.fn()} />);
      expect(screen.queryByRole('link', { name: /forgot password/i })).not.toBeInTheDocument();
    });

    it('renders link to login page', () => {
      render(<AuthForm mode="signup" onSubmit={vi.fn()} />);
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
        'href',
        '/auth/login'
      );
    });

    it('shows error for password shorter than 8 characters', async () => {
      const user = userEvent.setup();
      render(<AuthForm mode="signup" onSubmit={vi.fn()} />);

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

  describe('Loading State', () => {
    it('shows loading spinner when submitting', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      render(<AuthForm mode="login" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      });
    });

    it('disables button while submitting', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      render(<AuthForm mode="login" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('associates labels with inputs', () => {
      render(<AuthForm mode="login" onSubmit={vi.fn()} />);
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    });

    it('submits form on Enter key', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AuthForm mode="login" onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123{Enter}');

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });
});
