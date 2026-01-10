// apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpgradePrompt } from '../upgrade-prompt'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('UpgradePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('banner variant', () => {
    it('renders banner with upgrade message', () => {
      render(
        <UpgradePrompt variant="banner" targetTier="pro" source="test" />
      )

      expect(screen.getByText(/Upgrade to Pro/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /upgrade now/i })).toHaveAttribute(
        'href',
        '/pricing'
      )
    })

    it('shows close button when onDismiss provided', async () => {
      const onDismiss = vi.fn()
      const user = userEvent.setup()

      render(
        <UpgradePrompt
          variant="banner"
          targetTier="pro"
          source="test"
          onDismiss={onDismiss}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('hides close button when onDismiss not provided', () => {
      render(
        <UpgradePrompt variant="banner" targetTier="pro" source="test" />
      )

      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
    })
  })

  describe('card variant', () => {
    it('renders card with headline and benefits list', () => {
      render(
        <UpgradePrompt variant="card" targetTier="pro" source="test" />
      )

      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
      expect(screen.getByText('20 posters/month')).toBeInTheDocument()
      expect(screen.getByText('HD exports')).toBeInTheDocument()
      expect(screen.getByText('No watermark')).toBeInTheDocument()
      expect(screen.getByText('Priority templates')).toBeInTheDocument()
    })

    it('renders premium benefits when targetTier is premium', () => {
      render(
        <UpgradePrompt variant="card" targetTier="premium" source="test" />
      )

      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
      expect(screen.getByText('Unlimited posters')).toBeInTheDocument()
      expect(screen.getByText('4K exports')).toBeInTheDocument()
    })

    it('has CTA link to pricing', () => {
      render(
        <UpgradePrompt variant="card" targetTier="pro" source="test" />
      )

      expect(screen.getByRole('link', { name: /upgrade now/i })).toHaveAttribute(
        'href',
        '/pricing'
      )
    })
  })
})
