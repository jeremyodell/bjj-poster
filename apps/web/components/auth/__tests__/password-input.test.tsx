import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from '../password-input';

describe('PasswordInput', () => {
  it('renders password input with hidden text by default', () => {
    render(<PasswordInput />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'password');
  });

  it('toggles visibility when eye button is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordInput />);

    const input = screen.getByRole('textbox');
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    expect(input).toHaveAttribute('type', 'password');

    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: /hide password/i })
    ).toBeInTheDocument();
  });

  it('toggles back to hidden when clicked again', async () => {
    const user = userEvent.setup();
    render(<PasswordInput />);

    const toggleButton = screen.getByRole('button', { name: /show password/i });

    await user.click(toggleButton);
    await user.click(screen.getByRole('button', { name: /hide password/i }));

    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'password');
  });

  it('forwards ref to input element', () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>;
    render(<PasswordInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes through additional props', () => {
    render(<PasswordInput placeholder="Enter password" id="test-password" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter password');
    expect(input).toHaveAttribute('id', 'test-password');
  });
});
