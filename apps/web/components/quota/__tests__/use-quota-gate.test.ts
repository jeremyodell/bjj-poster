import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuotaGate } from '../use-quota-gate'
import { useUserStore } from '@/lib/stores'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}))

describe('useQuotaGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store
    act(() => {
      useUserStore.setState({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
        subscriptionTier: 'free',
        postersThisMonth: 0,
        postersLimit: 3,
      })
    })
  })

  describe('isBlocked', () => {
    it('returns false when under quota', () => {
      act(() => {
        useUserStore.setState({ postersThisMonth: 2, postersLimit: 3 })
      })

      const { result } = renderHook(() => useQuotaGate())

      expect(result.current.isBlocked).toBe(false)
    })

    it('returns true when at quota and tier is free', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 3,
          postersLimit: 3,
        })
      })

      const { result } = renderHook(() => useQuotaGate())

      expect(result.current.isBlocked).toBe(true)
    })

    it('returns false when at quota but tier is pro', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'pro',
          postersThisMonth: 20,
          postersLimit: 20,
        })
      })

      const { result } = renderHook(() => useQuotaGate())

      expect(result.current.isBlocked).toBe(false)
    })

    it('returns false when tier is premium regardless of usage', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'premium',
          postersThisMonth: 100,
          postersLimit: -1,
        })
      })

      const { result } = renderHook(() => useQuotaGate())

      expect(result.current.isBlocked).toBe(false)
    })
  })

  describe('showModal', () => {
    it('equals isBlocked value', () => {
      act(() => {
        useUserStore.setState({
          subscriptionTier: 'free',
          postersThisMonth: 3,
          postersLimit: 3,
        })
      })

      const { result } = renderHook(() => useQuotaGate())

      expect(result.current.showModal).toBe(true)
      expect(result.current.showModal).toBe(result.current.isBlocked)
    })
  })

  describe('handleUpgrade', () => {
    it('navigates to /pricing', () => {
      const { result } = renderHook(() => useQuotaGate())

      act(() => {
        result.current.handleUpgrade()
      })

      expect(mockPush).toHaveBeenCalledWith('/pricing')
    })
  })

  describe('handleMaybeLater', () => {
    it('navigates to /dashboard', () => {
      const { result } = renderHook(() => useQuotaGate())

      act(() => {
        result.current.handleMaybeLater()
      })

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })
})
