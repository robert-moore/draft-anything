'use client'

import { BrutalButton } from '@/components/ui/brutal-button'
import { cn } from '@/lib/utils'
import { Bot, BotOff } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface AutopickToggleProps {
  draftId: string
  className?: string
  onToggle?: (enabled: boolean) => void
}

function createGuestFetch() {
  return async (url: string, options: RequestInit = {}) => {
    const GUEST_CLIENT_ID_KEY = 'draft-guest-client-id'
    let clientId = localStorage.getItem(GUEST_CLIENT_ID_KEY)
    if (!clientId) {
      clientId = crypto.randomUUID()
      localStorage.setItem(GUEST_CLIENT_ID_KEY, clientId)
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(clientId ? { 'x-client-id': clientId } : {})
      }
    })
  }
}

export function AutopickToggle({
  draftId,
  className,
  onToggle
}: AutopickToggleProps) {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/autopick-settings`)
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required')
          return
        }
        if (response.status === 403) {
          setError('Must be participant to use autopick')
          return
        }
        throw new Error('Failed to load autopick settings')
      }
      
      const data = await response.json()
      setEnabled(data.enabled)
    } catch (err: any) {
      setError(err.message || 'Failed to load autopick settings')
    } finally {
      setLoading(false)
    }
  }, [draftId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const toggle = async () => {
    if (loading) return

    try {
      setLoading(true)
      setError(null)

      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/autopick-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle autopick')
      }

      const data = await response.json()
      setEnabled(data.enabled)
      onToggle?.(data.enabled)
    } catch (err: any) {
      setError(err.message || 'Failed to toggle autopick')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <BrutalButton
        onClick={toggle}
        disabled={loading}
        variant={enabled ? 'filled' : 'default'}
        className={cn(
          'w-full flex items-center justify-center gap-2 transition-all duration-200',
          enabled && 'bg-green-100 hover:bg-green-200 border-green-500 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:border-green-400 dark:text-green-100'
        )}
      >
        {enabled ? (
          <Bot className="w-4 h-4" />
        ) : (
          <BotOff className="w-4 h-4" />
        )}
        <span className="font-bold text-xs tracking-wider uppercase">
          Autopick {enabled ? 'ON' : 'OFF'}
        </span>
      </BrutalButton>

      {error && (
        <div className="text-xs text-destructive mt-2">
          {error}
        </div>
      )}
    </div>
  )
}