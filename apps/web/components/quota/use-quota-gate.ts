'use client'

import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/stores'

export interface UseQuotaGateReturn {
  isBlocked: boolean
  showModal: boolean
  handleUpgrade: () => void
  handleMaybeLater: () => void
}

export function useQuotaGate(): UseQuotaGateReturn {
  const router = useRouter()
  const canCreatePoster = useUserStore((state) => state.canCreatePoster())
  const subscriptionTier = useUserStore((state) => state.subscriptionTier)

  const isBlocked = !canCreatePoster && subscriptionTier === 'free'
  const showModal = isBlocked

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  const handleMaybeLater = () => {
    router.push('/dashboard')
  }

  return {
    isBlocked,
    showModal,
    handleUpgrade,
    handleMaybeLater,
  }
}
