'use client'

import { createGuestFetch } from '@/lib/guest-utils'
import { useState } from 'react'

interface AdminAutopickButtonProps {
  draftId: string
  currentPlayerName: string
  isAdmin: boolean
  isMyTurn: boolean
  draftState: string
}

export function AdminAutopickButton({
  draftId,
  currentPlayerName,
  isAdmin,
  isMyTurn,
  draftState
}: AdminAutopickButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only show if user is admin, someone else is on clock, and draft is active
  if (!isAdmin || isMyTurn || draftState !== 'active') {
    return null
  }

  const handleAdminAutopick = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/admin-autopick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to autopick')
      }
    } catch (error: any) {
      console.error('Admin autopick error:', error)
      setError(error.message || 'Failed to autopick')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <button
        onClick={handleAdminAutopick}
        disabled={isLoading}
        className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/50 rounded-md transition-all hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-pulse">●</span>
            Autopicking...
          </span>
        ) : (
          <>⚡ Autopick for {currentPlayerName}</>
        )}
      </button>
      
      {error && (
        <div className="text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}