import { getGuestClientId, hasGuestClientId } from '@/lib/guest-utils'
import { useEffect, useState } from 'react'

export function useGuest() {
  const [isGuest, setIsGuest] = useState(false)
  const [clientId, setClientId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we have a guest client ID
    const hasClientId = hasGuestClientId()
    if (hasClientId) {
      setIsGuest(true)
      setClientId(getGuestClientId())
    }
    setIsLoading(false)
  }, [])

  return {
    isGuest,
    clientId,
    isLoading
  }
}
