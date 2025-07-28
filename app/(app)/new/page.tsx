'use client'

import { BrutalButton } from '@/components/ui/brutal-button'
import { BrutalSection } from '@/components/ui/brutal-section'
import { BrutalistButton } from '@/components/ui/brutalist-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { PageHeader } from '@/components/ui/page-header'
import {
  RadioGroupSegmented,
  RadioGroupSegmentedItem
} from '@/components/ui/radio-group-segmented'
import { createClient } from '@/lib/supabase/client'
import { Edit, Infinity, List, Timer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NewDraftPage() {
  const [name, setName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [maxDrafters, setMaxDrafters] = useState<number | null>(4)
  const [secPerRound, setSecPerRound] = useState<number | null>(60)
  const [numRounds, setNumRounds] = useState<number | null>(3)
  const [timerMode, setTimerMode] = useState<'timed' | 'untimed'>('timed')
  const [selectionType, setSelectionType] = useState<'freeform' | 'curated'>(
    'freeform'
  )
  const [curatedOptions, setCuratedOptions] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [showGuestChoice, setShowGuestChoice] = useState(false)
  const router = useRouter()

  // Guest management utilities
  const GUEST_CLIENT_ID_KEY = 'draft-guest-client-id'

  function getGuestClientId(): string {
    if (typeof window === 'undefined') {
      return ''
    }

    let clientId = localStorage.getItem(GUEST_CLIENT_ID_KEY)
    if (!clientId) {
      clientId = crypto.randomUUID()
      localStorage.setItem(GUEST_CLIENT_ID_KEY, clientId)
    }
    return clientId
  }

  function hasGuestClientId(): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    return !!localStorage.getItem(GUEST_CLIENT_ID_KEY)
  }

  function createGuestFetch() {
    return async (url: string, options: RequestInit = {}) => {
      const clientId = getGuestClientId()
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'x-client-id': clientId
        }
      })
    }
  }

  // Check user authentication status
  useEffect(() => {
    const supabase = createClient()

    const getSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setIsLoadingUser(false)
    }

    getSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsLoadingUser(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate required fields
    if (!name.trim()) {
      setError('Draft name is required')
      setIsLoading(false)
      return
    }
    if (!adminName.trim()) {
      setError('Your name is required')
      setIsLoading(false)
      return
    }
    if (maxDrafters === null || maxDrafters < 2) {
      setError('Max players must be at least 2')
      setIsLoading(false)
      return
    }
    if (numRounds === null || numRounds < 1) {
      setError('Number of rounds must be at least 1')
      setIsLoading(false)
      return
    }
    if (timerMode === 'timed' && (secPerRound === null || secPerRound < 30)) {
      setError('Seconds per pick must be at least 30 for timed drafts')
      setIsLoading(false)
      return
    }
    if (selectionType === 'curated' && !curatedOptions.trim()) {
      setError('Curated options are required when using curated selection type')
      setIsLoading(false)
      return
    }

    try {
      const requestBody = {
        name,
        adminName: adminName.trim(),
        maxDrafters,
        secPerRound: timerMode === 'untimed' ? 0 : secPerRound || 0,
        numRounds,
        isFreeform: selectionType === 'freeform',
        curatedOptions:
          selectionType === 'curated' ? curatedOptions : undefined,
        timerMode
      }

      let response: Response

      if (user) {
        // Authenticated user
        response = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      } else {
        // Guest user
        const guestFetch = createGuestFetch()
        response = await guestFetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create draft')
      }

      const { draft } = await response.json()

      // Redirect to the draft using the GUID
      router.push(`/drafts/${draft.guid}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft')
    } finally {
      setIsLoading(false)
    }
  }

  const draftTemplates = [
    {
      id: 'TEMPLATE_001',
      title: 'CINEMA_RANKINGS',
      category: 'ENTERTAINMENT',
      icon: 'MOV',
      sample: ['The Godfather', 'Pulp Fiction', 'Citizen Kane']
    },
    {
      id: 'TEMPLATE_002',
      title: 'FOOD_ESTABLISHMENTS',
      category: 'CULINARY',
      icon: 'EAT',
      sample: ["Joe's Pizza", 'Burger Palace', 'Sushi Central']
    },
    {
      id: 'TEMPLATE_003',
      title: 'TRAVEL_DESTINATIONS',
      category: 'GEOGRAPHIC',
      icon: 'LOC',
      sample: ['Paris', 'Tokyo', 'Bali']
    },
    {
      id: 'TEMPLATE_004',
      title: 'AUDIO_ARTISTS',
      category: 'MUSIC',
      icon: 'SND',
      sample: ['The Beatles', 'Queen', 'Drake']
    }
  ]

  return (
    <div>
      <PageHeader
        title="Create Draft"
        subtitle="Turn any topic into a ranking"
      />

      <div className="px-6 pb-12 bg-background">
        <div className="max-w-3xl mx-auto">
          {/* Show guest choice if not authenticated and haven't made choice yet */}
          {!isLoadingUser && !user && !showGuestChoice && (
            <div className="mb-8">
              <BrutalSection variant="bordered" className="text-center">
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-foreground">
                    Create Draft
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Choose how you'd like to create this draft
                  </p>

                  <div className="space-y-4">
                    <BrutalButton
                      onClick={() =>
                        (window.location.href = `/auth/login?redirectTo=/new`)
                      }
                      variant="filled"
                      className="w-full"
                    >
                      Sign In
                    </BrutalButton>

                    <div className="text-xs text-muted-foreground mb-4">
                      Sign in to create drafts and view your draft history from
                      any device
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or
                        </span>
                      </div>
                    </div>

                    <BrutalButton
                      onClick={() => {
                        setShowGuestChoice(true)
                      }}
                      variant="filled"
                      className="w-full"
                    >
                      Create as Guest
                    </BrutalButton>
                  </div>
                </div>
              </BrutalSection>
            </div>
          )}

          {/* Core Form */}
          {!isLoadingUser && (user || showGuestChoice) && (
            <div className="border-2 border-border bg-card p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-foreground">
                Draft Settings
              </h2>

              {!user && (
                <div className="mb-6 p-4 border-2 border-primary bg-primary/10">
                  <p className="text-sm text-foreground">
                    <strong>Creating as Guest:</strong> You'll be able to access
                    this draft via a link, but won't be able to see it in your
                    draft history or use another device to join.{' '}
                    <a
                      href="/auth/login"
                      className=" hover:underline font-bold"
                    >
                      Sign in
                    </a>{' '}
                    for free to unlock more features.
                  </p>
                </div>
              )}

              <div className="text-base text-muted-foreground mb-6">
                This is a snake draft - the order will be randomized when the
                draft starts.
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Topic Input */}
                <div>
                  <Label
                    htmlFor="name"
                    className="text-lg font-bold mb-3 block text-foreground"
                  >
                    What are you drafting?
                  </Label>
                  <Input
                    id="name"
                    placeholder="Best Pizza Places, Favorite Movies..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className={`text-xl py-4 rounded-none border-2 w-full bg-card text-foreground placeholder:text-muted-foreground focus:border-border ${
                      !name.trim() ? 'border-primary' : 'border-border'
                    }`}
                  />
                </div>

                {/* Admin Name Input */}
                <div>
                  <Label
                    htmlFor="adminName"
                    className="text-lg font-bold mb-3 block text-foreground"
                  >
                    Your name
                  </Label>
                  <Input
                    id="adminName"
                    placeholder="Enter your name"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    required
                    className={`text-xl py-4 rounded-none border-2 w-full bg-card text-foreground placeholder:text-muted-foreground focus:border-border ${
                      !adminName.trim() ? 'border-primary' : 'border-border'
                    }`}
                  />
                </div>

                {/* Draft Configuration */}
                <div className="space-y-8">
                  {/* Draft Structure */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <NumberInput
                        id="maxDrafters"
                        label="Max Players"
                        value={maxDrafters}
                        onChange={setMaxDrafters}
                        min={2}
                        max={20}
                        required={true}
                      />
                      <NumberInput
                        id="numRounds"
                        label="Rounds"
                        value={numRounds}
                        onChange={setNumRounds}
                        min={1}
                        max={20}
                        required={true}
                      />
                    </div>
                  </div>

                  {/* Selection Type */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      Selection Type
                    </h3>
                    <div className="space-y-3">
                      <RadioGroupSegmented
                        value={selectionType}
                        onValueChange={value =>
                          setSelectionType(value as 'freeform' | 'curated')
                        }
                      >
                        <RadioGroupSegmentedItem value="freeform" icon={Edit}>
                          Freeform Selections
                        </RadioGroupSegmentedItem>
                        <RadioGroupSegmentedItem value="curated" icon={List}>
                          Curated Options
                        </RadioGroupSegmentedItem>
                      </RadioGroupSegmented>

                      <div className="text-xs text-muted-foreground space-y-2">
                        {selectionType === 'freeform' && (
                          <>
                            <p>
                              <strong>Freeform Selections:</strong> Players can
                              pick any item they want during their turn
                            </p>
                            <p className="text-primary font-medium">
                              Challenge mechanism: Other players can challenge
                              picks within 30 seconds if they think the pick is
                              invalid or inappropriate. If at least 50% of
                              eligible voters agree, the pick is removed and the
                              player must choose again.
                            </p>
                          </>
                        )}
                      </div>

                      {selectionType === 'curated' && (
                        <div className="space-y-4">
                          <div className="text-xs text-muted-foreground space-y-2">
                            <p>
                              <strong>Curated Selections:</strong> Players
                              choose from a predefined list of options you
                              provide
                            </p>
                          </div>
                          <div className="mt-6">
                            <Label
                              htmlFor="curatedOptions"
                              className="text-sm font-bold"
                            >
                              Draft Options (one per line, max 1000)
                            </Label>
                          </div>
                          <textarea
                            id="curatedOptions"
                            value={curatedOptions}
                            onChange={e => setCuratedOptions(e.target.value)}
                            placeholder="Enter your draft options here, one per line..."
                            className="w-full h-32 p-3 border-2 border-border bg-card text-foreground placeholder:text-muted-foreground resize-none"
                            maxLength={50000} // Reasonable limit for 1000 items
                          />
                          <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <span>
                              {
                                curatedOptions
                                  .split('\n')
                                  .filter(line => line.trim()).length
                              }{' '}
                              option
                              {curatedOptions
                                .split('\n')
                                .filter(line => line.trim()).length !== 1
                                ? 's'
                                : ''}
                            </span>
                            {curatedOptions
                              .split('\n')
                              .filter(line => line.trim()).length > 0 &&
                              (() => {
                                const optionCount = curatedOptions
                                  .split('\n')
                                  .filter(line => line.trim()).length
                                const totalPicks =
                                  (maxDrafters || 0) * (numRounds || 0)
                                const longOptions = curatedOptions
                                  .split('\n')
                                  .filter(line => line.trim())
                                  .filter(line => line.length > 200)

                                if (longOptions.length > 0) {
                                  return (
                                    <span className="text-primary font-medium">
                                      <span className="mr-1">⚠</span>️ Options
                                      must be fewer than 200 characters
                                    </span>
                                  )
                                }
                                if (optionCount < totalPicks) {
                                  return (
                                    <span className="text-primary font-medium">
                                      <span className="mr-1">⚠</span>️ Need at
                                      least {totalPicks} options for{' '}
                                      {maxDrafters || '?'} players ×{' '}
                                      {numRounds || '?'} rounds
                                    </span>
                                  )
                                }
                                return null
                              })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timer Settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      Timer Settings
                    </h3>
                    <div className="space-y-3">
                      <RadioGroupSegmented
                        value={timerMode}
                        onValueChange={value =>
                          setTimerMode(value as 'timed' | 'untimed')
                        }
                      >
                        <RadioGroupSegmentedItem value="timed" icon={Timer}>
                          Timed
                        </RadioGroupSegmentedItem>
                        <RadioGroupSegmentedItem
                          value="untimed"
                          icon={Infinity}
                        >
                          Untimed
                        </RadioGroupSegmentedItem>
                      </RadioGroupSegmented>

                      {timerMode === 'untimed' ? (
                        <div className="border-2 border-border p-6 text-center">
                          <Infinity className="w-8 h-8 mx-auto mb-2 text-foreground" />
                          <p className="text-sm font-medium text-foreground">
                            No Time Limit
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Players can take as long as they need
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="pt-2">
                            <NumberInput
                              id="secPerRound"
                              label="Seconds per pick"
                              value={secPerRound}
                              onChange={setSecPerRound}
                              min={30}
                              max={300}
                              required={true}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {selectionType === 'curated'
                              ? 'A random option will be selected when time expires'
                              : 'Auto-pick activates when time expires'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="border-2 border-destructive bg-destructive/10 p-4">
                    <p className="text-destructive font-medium">{error}</p>
                    <p className="text-destructive/70 text-sm mt-1">
                      Try refreshing the page.
                    </p>
                  </div>
                )}

                <BrutalistButton
                  type="submit"
                  variant="primary"
                  className="w-full py-4 text-xl font-bold"
                  loading={isLoading}
                  disabled={
                    isLoading ||
                    !name.trim() ||
                    !adminName.trim() ||
                    maxDrafters === null ||
                    maxDrafters < 2 ||
                    numRounds === null ||
                    numRounds < 1 ||
                    (timerMode === 'timed' &&
                      (secPerRound === null || secPerRound < 30)) ||
                    (selectionType === 'curated' && !curatedOptions.trim()) ||
                    (selectionType === 'curated' &&
                      curatedOptions
                        .split('\n')
                        .filter(line => line.trim())
                        .some(line => line.length > 200))
                  }
                >
                  {isLoading ? 'Creating...' : 'Create Draft'}
                </BrutalistButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
