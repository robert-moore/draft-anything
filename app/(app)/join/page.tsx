'use client'

import { BrutalButton } from '@/components/ui/brutal-button'
import { BrutalInput } from '@/components/ui/brutal-input'
import { BrutalSection } from '@/components/ui/brutal-section'
import { AlertCircle, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function JoinDraftPage() {
  const router = useRouter()

  const [joinCode, setJoinCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoinDraft = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a join code')
      return
    }

    if (joinCode.length !== 4) {
      setError('Join code must be 4 digits')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/drafts/join-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          joinCode: joinCode.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join draft')
      }

      // Redirect to the draft
      router.push(`/drafts/${data.draft.guid}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join draft')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <BrutalSection variant="bordered" className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Join Draft</h1>
            <p className="text-muted-foreground">
              Enter the 4-digit code to join your friend's draft
            </p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <label
                htmlFor="joinCode"
                className="block text-sm font-medium mb-2"
              >
                Join Code
              </label>
              <BrutalInput
                id="joinCode"
                type="text"
                placeholder="1234"
                value={joinCode}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setJoinCode(value)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && joinCode.trim() && !isLoading) {
                    handleJoinDraft()
                  }
                }}
                maxLength={4}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <BrutalButton
              onClick={handleJoinDraft}
              disabled={isLoading || !joinCode.trim()}
              variant="filled"
              className="w-full"
            >
              {isLoading ? 'Joining...' : 'Join Draft'}
            </BrutalButton>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have a code?{' '}
              <button
                onClick={() => router.push('/new')}
                className="text-primary hover:underline font-medium"
              >
                Create your own draft
              </button>
            </p>
          </div>
        </BrutalSection>
      </div>
    </div>
  )
}
