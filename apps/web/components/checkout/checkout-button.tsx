'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { createCheckoutSession, type CreateCheckoutParams } from '@/lib/api/checkout';

export interface CheckoutButtonProps
  extends Omit<ButtonProps, 'onClick'>,
    CreateCheckoutParams {
  children: React.ReactNode;
}

export function CheckoutButton({
  tier,
  interval,
  children,
  disabled,
  ...props
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Redirecting to checkout...');

    try {
      const { url } = await createCheckoutSession({ tier, interval });
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      isLoading={isLoading}
      {...props}
    >
      {children}
    </Button>
  );
}
