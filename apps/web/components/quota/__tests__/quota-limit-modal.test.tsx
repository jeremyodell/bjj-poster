import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuotaLimitModal } from '../quota-limit-modal'
import { track } from '@/lib/analytics'
import type { Poster } from '@/lib/types/api'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode
    href: string
    onClick?: () => void
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

const mockPosters: Poster[] = [
  {
    id: 'poster-1',
    templateId: 'template-1',
    createdAt: '2026-01-05T12:00:00Z',
    thumbnailUrl: 'https://example.com/poster1.jpg',
    athleteName: 'John Doe',
    tournament: 'IBJJF Worlds',
    beltRank: 'purple',
    status: 'completed',
  },
  {
    id: 'poster-2',
    templateId: 'template-2',
    createdAt: '2026-01-08T14:00:00Z',
    thumbnailUrl: 'https://example.com/poster2.jpg',
    athleteName: 'Jane Smith',
    tournament: 'Pans',
    beltRank: 'brown',
    status: 'completed',
  },
]

describe('QuotaLimitModal', () => {
  const defaultProps = {
    open: true,
    posters: mockPosters,
    onUpgrade: vi.fn(),
    onMaybeLater: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders celebration header with poster count', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(
      screen.getByText(/you've created 2 awesome posters this month/i)
    ).toBeInTheDocument()
  })

  it('renders poster thumbnails', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/poster1.jpg')
    expect(images[1]).toHaveAttribute('src', 'https://example.com/poster2.jpg')
  })

  it('renders "Ready for more?" subheading', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(screen.getByText(/ready for more/i)).toBeInTheDocument()
  })

  it('renders UpgradePrompt card', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
    expect(screen.getByText('20 posters/month')).toBeInTheDocument()
  })

  it('renders alternative text with next month date', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(
      screen.getByText(/or wait until February 1 for 3 more free posters/i)
    ).toBeInTheDocument()
  })

  it('renders Maybe Later button', () => {
    render(<QuotaLimitModal {...defaultProps} />)

    expect(
      screen.getByRole('button', { name: /maybe later/i })
    ).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<QuotaLimitModal {...defaultProps} open={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  describe('non-dismissibility', () => {
    it('cannot be dismissed via ESC key', async () => {
      vi.useRealTimers()
      const user = userEvent.setup()

      render(
        <QuotaLimitModal
          open={true}
          posters={mockPosters}
          onUpgrade={vi.fn()}
          onMaybeLater={vi.fn()}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.keyboard('{Escape}')

      // Modal should still be present
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not have a close X button', () => {
      render(
        <QuotaLimitModal
          open={true}
          posters={mockPosters}
          onUpgrade={vi.fn()}
          onMaybeLater={vi.fn()}
        />
      )

      // The default DialogContent includes a close button with sr-only "Close" text
      // Our modal hides it with CSS
      const closeButton = screen.queryByRole('button', { name: /close/i })
      expect(closeButton).not.toBeInTheDocument()
    })
  })

  describe('button callbacks', () => {
    it('calls onUpgrade when upgrade button clicked', async () => {
      vi.useRealTimers() // Use real timers for this test
      const onUpgrade = vi.fn()
      const user = userEvent.setup()

      render(
        <QuotaLimitModal
          open={true}
          posters={mockPosters}
          onUpgrade={onUpgrade}
          onMaybeLater={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /upgrade now/i }))

      expect(onUpgrade).toHaveBeenCalledTimes(1)
    })

    it('calls onMaybeLater when Maybe Later clicked', async () => {
      vi.useRealTimers() // Use real timers for this test
      const onMaybeLater = vi.fn()
      const user = userEvent.setup()

      render(
        <QuotaLimitModal
          open={true}
          posters={mockPosters}
          onUpgrade={vi.fn()}
          onMaybeLater={onMaybeLater}
        />
      )

      await user.click(screen.getByRole('button', { name: /maybe later/i }))

      expect(onMaybeLater).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('shows generic message when posters array is empty', () => {
      render(
        <QuotaLimitModal
          open={true}
          posters={[]}
          onUpgrade={vi.fn()}
          onMaybeLater={vi.fn()}
        />
      )

      expect(
        screen.getByText(/you've hit your monthly limit/i)
      ).toBeInTheDocument()
    })

    it('does not render poster gallery when posters array is empty', () => {
      render(
        <QuotaLimitModal
          open={true}
          posters={[]}
          onUpgrade={vi.fn()}
          onMaybeLater={vi.fn()}
        />
      )

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('analytics', () => {
    it('tracks quota_limit_modal_viewed on mount', () => {
      render(
        <QuotaLimitModal
          open={true}
          posters={mockPosters}
          onUpgrade={vi.fn()}
          onMaybeLater={vi.fn()}
        />
      )

      expect(track).toHaveBeenCalledWith('quota_limit_modal_viewed', {
        postersCount: 2,
        tier: 'free',
      })
    })

    it('tracks quota_limit_upgrade_clicked on upgrade', async () => {
      vi.useRealTimers()
      const user = userEvent.setup()

      render(
        <QuotaLimitModal
          open={true}
          posters={mockPosters}
          onUpgrade={vi.fn()}
          onMaybeLater={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /upgrade now/i }))

      expect(track).toHaveBeenCalledWith('quota_limit_upgrade_clicked', {
        source: 'quota_modal',
      })
    })

    it('tracks quota_limit_maybe_later_clicked with next reset date', async () => {
      vi.useRealTimers()
      const user = userEvent.setup()

      render(
        <QuotaLimitModal
          open={true}
          posters={mockPosters}
          onUpgrade={vi.fn()}
          onMaybeLater={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: /maybe later/i }))

      expect(track).toHaveBeenCalledWith('quota_limit_maybe_later_clicked', {
        nextResetDate: 'February 1',
      })
    })
  })
})
