'use client'

import { AutoPickMonitor } from '@/components/draft/auto-pick-monitor'
import { DraftMetadata } from '@/components/draft/draft-metadata'
import { DraftPickGrid } from '@/components/draft/draft-pick-grid'
import { DraftTimer } from '@/components/draft/draft-timer'
import { ViewModeTabs } from '@/components/draft/view-mode-tabs'
import { BrutalButton } from '@/components/ui/brutal-button'
import { BrutalInput } from '@/components/ui/brutal-input'
import { BrutalListItem } from '@/components/ui/brutal-list-item'
import { BrutalSection } from '@/components/ui/brutal-section'
import { GeometricBackground } from '@/components/ui/geometric-background'
import { NumberBox } from '@/components/ui/number-box'
import { createClient } from '@/lib/supabase/client'
import type { Draft, DraftPick, Participant } from '@/types/draft'
import { AlertCircle } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const supabase = createClient()

export default function DraftPage() {
  const params = useParams()
  const draftId = params.id as string

  const [draft, setDraft] = useState<Draft | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [picks, setPicks] = useState<DraftPick[]>([])
  const [currentPick, setCurrentPick] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReloadingAfterDraftStart, setIsReloadingAfterDraftStart] =
    useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInviteLink, setShowInviteLink] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [viewMode, setViewMode] = useState<
    'selections' | 'by-round' | 'by-drafter'
  >('selections')
  const [challengeTimeLeft, setChallengeTimeLeft] = useState<number | null>(
    null
  )
  const [currentChallenge, setCurrentChallenge] = useState<any>(null)
  const [challengeVotes, setChallengeVotes] = useState<any[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [voteCounts, setVoteCounts] = useState<any>(null)

  const participantsRef = useRef<Participant[]>([])

  const loadDraft = async () => {
    try {
      const response = await fetch(`/api/drafts/${draftId}`)
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `/auth/login?redirectTo=/drafts/${draftId}`
          return
        }
        throw new Error('Failed to load draft')
      }
      const data = await response.json()

      setDraft(data.draft)
      setParticipants(data.participants || [])
      setPicks(data.picks || [])
      setCurrentUser(data.currentUser)
      setIsAdmin(data.isAdmin || false)

      if (
        data.currentUser &&
        data.participants?.some(
          (p: Participant) => p.id === data.currentUser.id
        )
      ) {
        setIsJoined(true)
      }

      // Load challenge data if draft is in challenge state
      if (data.draft.draftState === 'challenge') {
        await loadChallenge()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load draft')
    } finally {
      setIsLoading(false)
    }
  }

  const loadChallenge = async () => {
    try {
      const response = await fetch(`/api/drafts/${draftId}/challenge`)
      if (response.ok) {
        const data = await response.json()
        setCurrentChallenge(data.challenge)
        if (data.challenge) {
          await loadVoteCounts()
        }
      }
    } catch (err) {
      console.error('Failed to load challenge:', err)
    }
  }

  const loadVoteCounts = async () => {
    try {
      const response = await fetch(`/api/drafts/${draftId}/challenge/votes`)
      if (response.ok) {
        const data = await response.json()
        setVoteCounts(data)
        setHasVoted(data.userVote !== undefined)
      }
    } catch (err) {
      console.error('Failed to load vote counts:', err)
    }
  }

  useEffect(() => {
    participantsRef.current = participants
  }, [participants])

  useEffect(() => {
    const draftId = params.id as string
    if (!draftId) return

    const timeout = setTimeout(() => {
      const draftUsersSub = supabase
        .channel(`draft-users-${draftId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'da',
            table: 'draft_users',
            filter: `draft_id=eq.${draftId}`
          },
          payload => {
            const newUser = payload.new

            const newParticipant = {
              id: newUser.user_id,
              name: newUser.draft_username,
              isReady: newUser.is_ready,
              position: newUser.position,
              createdAt: newUser.created_at
            }

            setParticipants(prev => {
              if (prev.some(p => p.id === newParticipant.id)) return prev
              return [...prev, newParticipant]
            })
          }
        )
        .subscribe()

      const draftSelectionsSub = supabase
        .channel(`draft-selections-${draftId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'da',
            table: 'draft_selections',
            filter: `draft_id=eq.${draftId}`
          },
          payload => {
            const newPick = payload.new

            setPicks(prev => {
              if (
                prev.some(
                  p =>
                    p.pickNumber === newPick.pick_number &&
                    p.clientId === newPick.user_id
                )
              ) {
                return prev
              }

              return [
                ...prev,
                {
                  pickNumber: newPick.pick_number,
                  clientId: newPick.user_id,
                  clientName:
                    participantsRef.current.find(p => p.id === newPick.user_id)
                      ?.name ?? 'Unknown',
                  payload: newPick.payload,
                  createdAt: newPick.created_at
                }
              ]
            })
          }
        )
        .subscribe()

      const draftStateSub = supabase
        .channel(`draft-state-${draftId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'da',
            table: 'drafts',
            filter: `id=eq.${draftId}`
          },
          async payload => {
            const prevState = draft?.draftState || 'setting_up'
            const updatedState = payload.new.draft_state
            const positionOnClock = payload.new.current_position_on_clock

            setDraft(prev => {
              if (!prev) return prev
              return {
                ...prev,
                draftState: updatedState,
                currentPositionOnClock: positionOnClock,
                turnStartedAt: payload.new.turn_started_at,
                timerPaused: payload.new.timer_paused ?? false
              }
            })

            if (prevState === 'setting_up' && updatedState === 'active') {
              // Reload to get the randomized pick order
              setIsReloadingAfterDraftStart(true)
              await loadDraft()
              setIsReloadingAfterDraftStart(false)
            }

            // Handle challenge state changes
            if (updatedState === 'challenge') {
              await loadChallenge()
            } else if (prevState === 'challenge' && updatedState === 'active') {
              // Challenge resolved, reload draft data
              setCurrentChallenge(null)
              setHasVoted(false)
              await loadDraft()
            }
          }
        )
        .subscribe()

      // Challenge subscriptions
      const challengeSub = supabase
        .channel(`draft-challenges-${draftId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'da',
            table: 'draft_challenges',
            filter: `draft_id=eq.${draftId}`
          },
          payload => {
            setCurrentChallenge(payload.new)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'da',
            table: 'draft_challenges',
            filter: `draft_id=eq.${draftId}`
          },
          payload => {
            setCurrentChallenge(payload.new)
          }
        )
        .subscribe()

      const challengeVotesSub = supabase
        .channel(`draft-challenge-votes-${draftId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'da',
            table: 'draft_challenge_votes'
          },
          async payload => {
            setChallengeVotes(prev => [...prev, payload.new])
            // Refresh vote counts when new vote is cast
            if (currentChallenge) {
              await loadVoteCounts()
            }
          }
        )
        .subscribe()

      // Clean up on unmount
      return () => {
        supabase.removeChannel(draftUsersSub)
        supabase.removeChannel(draftSelectionsSub)
        supabase.removeChannel(draftStateSub)
        supabase.removeChannel(challengeSub)
        supabase.removeChannel(challengeVotesSub)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [draftId])

  // Load draft data and check if already joined
  useEffect(() => {
    loadDraft()
  }, [draftId])

  // Calculate challenge time remaining
  useEffect(() => {
    if (!picks.length || !currentUser) return

    const lastPick = picks[picks.length - 1]
    const isLastPickByMe = lastPick.clientId === currentUser.id

    if (isLastPickByMe) {
      setChallengeTimeLeft(null)
      return
    }

    // Parse the createdAt timestamp properly
    // Handle the format "2025-07-19 14:48:07.297"
    const parseTimestamp = (timestamp: string) => {
      // Replace spaces with 'T' and add 'Z' for proper ISO format
      const isoString = timestamp.replace(' ', 'T') + 'Z'
      return new Date(isoString).getTime()
    }

    const lastPickTime = parseTimestamp(lastPick.createdAt)
    const now = Date.now()
    const timeSinceLastPick = now - lastPickTime
    const thirtySeconds = 30 * 1000
    const timeRemaining = thirtySeconds - timeSinceLastPick

    // Debug logging
    console.log('Challenge timing debug:', {
      lastPickTime,
      now,
      timeSinceLastPick,
      timeRemaining,
      lastPickCreatedAt: lastPick.createdAt
    })

    if (timeRemaining <= 0) {
      setChallengeTimeLeft(null)
      return
    }

    setChallengeTimeLeft(Math.ceil(timeRemaining / 1000))

    const interval = setInterval(() => {
      setChallengeTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [picks, currentUser])

  const handleJoinDraft = async () => {
    if (!playerName.trim()) return

    try {
      const response = await fetch(`/api/drafts/${draftId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim() })
      })

      if (!response.ok) throw new Error('Failed to join draft')

      const newParticipant = await response.json()
      setParticipants(prev => [...prev, newParticipant])
      setIsJoined(true)
      setPlayerName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join draft')
    }
  }

  const handleStartDraft = async () => {
    try {
      const response = await fetch(`/api/drafts/${draftId}/start`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to start draft')

      setDraft(prev => (prev ? { ...prev, draftState: 'active' } : null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start draft')
    }
  }

  const handleMakePick = async () => {
    if (!currentPick.trim()) return

    try {
      const response = await fetch(`/api/drafts/${draftId}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: currentPick.trim()
        })
      })

      if (!response.ok) throw new Error('Failed to make pick')

      const newPick = await response.json()
      // Clear the input after successful pick
      setCurrentPick('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make pick')
    }
  }

  const handleChallenge = async () => {
    try {
      const response = await fetch(`/api/drafts/${draftId}/challenge`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        setError(error.error || 'Failed to initiate challenge')
        return
      }

      const data = await response.json()
      setCurrentChallenge(data.challenge)
      setDraft(prev => (prev ? { ...prev, draftState: 'challenge' } : null))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to initiate challenge'
      )
    }
  }

  const handleVote = async (vote: boolean) => {
    try {
      const response = await fetch(`/api/drafts/${draftId}/challenge/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote })
      })

      if (!response.ok) {
        const error = await response.json()
        setError(error.error || 'Failed to cast vote')
        return
      }

      setHasVoted(true)
      await loadVoteCounts() // Refresh vote counts after voting
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cast vote')
    }
  }

  const getStateInfo = (state: Draft['draftState']) => {
    switch (state) {
      case 'setting_up':
        return {
          label: 'SETUP',
          variant: 'default' as const
        }
      case 'active':
        return {
          label: 'LIVE',
          variant: 'filled' as const
        }
      case 'completed':
        return {
          label: 'DONE',
          variant: 'default' as const
        }
      case 'paused':
        return {
          label: 'PAUSED',
          variant: 'default' as const
        }
      default:
        return {
          label: 'ERROR',
          variant: 'default' as const
        }
    }
  }

  const handleShareDraft = async () => {
    if (!inviteLink) {
      try {
        const response = await fetch(`/api/drafts/${draftId}/invite`, {
          method: 'POST'
        })

        if (!response.ok) throw new Error('Failed to create invite link')

        const data = await response.json()
        setInviteLink(data.inviteLink)
        setShowInviteLink(true)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create invite link'
        )
        return
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: draft?.name || 'Join my draft',
          text: 'Come join this draft!',
          url: inviteLink
        })
      } catch (err) {
        navigator.clipboard.writeText(inviteLink)
      }
    } else {
      navigator.clipboard.writeText(inviteLink)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32">
          <BrutalSection
            variant="bordered"
            className="w-96 text-center"
            background="diagonal"
          >
            <div className="p-8">
              <div className="font-mono text-lg font-bold mb-4 text-foreground">
                Loading draft data...
              </div>
              <div className="text-sm opacity-70">
                {'[' + '█'.repeat(10) + '▒'.repeat(20) + '] 33%'}
              </div>
            </div>
          </BrutalSection>
        </div>
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32">
          <BrutalSection variant="bordered" className="w-96 text-center">
            <div className="p-8">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <div className="font-mono text-lg font-bold text-foreground">
                {error || 'Draft not found'}
              </div>
            </div>
          </BrutalSection>
        </div>
      </div>
    )
  }

  const stateInfo = getStateInfo(draft.draftState)

  // Get current round and pick info
  const getCurrentRoundInfo = () => {
    const totalPicks = picks.length
    const picksPerRound = participants.length
    const currentRound = Math.min(
      draft.numRounds,
      Math.floor(totalPicks / picksPerRound) + 1
    )
    const pickInRound = (totalPicks % picksPerRound) + 1

    return { currentRound, pickInRound, totalPicks }
  }

  const { currentRound, pickInRound } = getCurrentRoundInfo()

  // Organize picks by rounds
  const getPicksByRounds = () => {
    const rounds: DraftPick[][] = []
    const picksPerRound = participants.length

    for (let i = 0; i < picks.length; i += picksPerRound) {
      rounds.push(picks.slice(i, i + picksPerRound))
    }

    return rounds
  }

  // Organize picks by drafter
  const getPicksByDrafter = () => {
    const drafterMap = new Map<string, DraftPick[]>()

    picks.forEach(pick => {
      if (!drafterMap.has(pick.clientName)) {
        drafterMap.set(pick.clientName, [])
      }
      drafterMap.get(pick.clientName)!.push(pick)
    })

    return Array.from(drafterMap.entries())
      .map(([name, picks]) => ({
        name,
        picks: picks.sort((a, b) => a.pickNumber - b.pickNumber)
      }))
      .sort((a, b) => a.picks[0]?.pickNumber - b.picks[0]?.pickNumber)
  }

  const roundsData = getPicksByRounds()
  const drafterData = getPicksByDrafter()

  const isMyTurn =
    isJoined &&
    currentUser &&
    participants.find(p => p.id === currentUser?.id)?.position ===
      draft?.currentPositionOnClock

  return (
    <div className="min-h-screen bg-background">
      {/* Auto-pick handler (only for timed drafts) */}
      {draft && parseInt(draft.secPerRound) > 0 && (
        <AutoPickMonitor
          draftId={draft.id}
          turnStartedAt={draft.turnStartedAt}
          secondsPerRound={parseInt(draft.secPerRound)}
          isMyTurn={isMyTurn}
          currentPickNumber={picks.length + 1}
        />
      )}

      <div className="max-w-7xl mx-auto flex pb-8">
        {/* Main Content */}
        <main className="flex-1 px-6 pt-6 bg-background">
          {/* Draft Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                {draft.name}
              </h1>
              <NumberBox
                number={stateInfo.label}
                size="sm"
                variant={stateInfo.variant}
                className="px-4"
              />
            </div>
            {draft.draftState === 'setting_up' ? (
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">PLAYERS</span>
                  <span className="font-mono text-foreground">
                    {participants.length}/{draft.maxDrafters}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">TIMER</span>
                  <span className="font-mono text-foreground">
                    {parseInt(draft.secPerRound) === 0
                      ? 'UNTIMED'
                      : `${parseInt(draft.secPerRound)}s`}
                  </span>
                </div>
              </div>
            ) : (
              <DraftMetadata
                players={{
                  current: participants.length,
                  max: draft.maxDrafters,
                  isMax: true
                }}
                timer={parseInt(draft.secPerRound)}
                round={{ current: currentRound, total: draft.numRounds }}
                pick={{ current: pickInRound, perRound: participants.length }}
              />
            )}
          </div>
          {/* Join Draft */}
          {!isJoined && draft.draftState === 'setting_up' && (
            <div className="py-8">
              <div className="max-w-xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
                  Join Draft
                </h2>
                <div className="flex gap-4">
                  <BrutalInput
                    placeholder="Your name"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleJoinDraft()}
                    variant="boxed"
                    className="flex-1"
                    autoFocus
                  />
                  <BrutalButton
                    onClick={handleJoinDraft}
                    disabled={!playerName.trim()}
                    variant="filled"
                  >
                    Join
                  </BrutalButton>
                </div>
              </div>
            </div>
          )}

          {/* Start Draft */}
          {isJoined &&
            isAdmin &&
            draft.draftState === 'setting_up' &&
            participants.length >= 2 && (
              <div className="py-8">
                <BrutalButton
                  onClick={handleStartDraft}
                  variant="filled"
                  className="w-full max-w-md mx-auto block"
                  size="lg"
                >
                  Start Draft ({participants.length} players)
                </BrutalButton>
              </div>
            )}

          {/* Current Pick - Primary Focus Area */}
          {!isReloadingAfterDraftStart &&
            (draft.draftState === 'active' ||
              (draft.draftState === 'completed' && picks.length > 0)) && (
              <div className="py-8">
                <div className="max-w-2xl mx-auto">
                  {isJoined &&
                  currentUser &&
                  participants.find(p => p.id === currentUser?.id)?.position ===
                    draft.currentPositionOnClock ? (
                    <div className="bg-card border-2 border-border p-8 relative overflow-hidden">
                      <GeometricBackground variant="diagonal" opacity={0.05} />
                      <div className="relative z-10">
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-bold text-foreground">
                            Round {currentRound} - Pick {pickInRound}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            It's your turn to pick
                          </p>
                          <div className="mt-4 flex justify-center">
                            <DraftTimer
                              turnStartedAt={draft.turnStartedAt}
                              secondsPerRound={parseInt(draft.secPerRound)}
                              isPaused={draft.timerPaused}
                              variant="full"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <BrutalInput
                            placeholder="Enter your pick..."
                            value={currentPick}
                            onChange={e => setCurrentPick(e.target.value)}
                            onKeyDown={e =>
                              e.key === 'Enter' && handleMakePick()
                            }
                            variant="boxed"
                            className="w-full bg-card text-foreground text-lg py-3"
                            autoFocus
                          />
                          <BrutalButton
                            onClick={handleMakePick}
                            disabled={!currentPick.trim()}
                            variant="filled"
                            className="w-full py-3 text-lg"
                          >
                            Submit Pick
                          </BrutalButton>
                        </div>
                      </div>
                    </div>
                  ) : draft.draftState === 'completed' ? (
                    <div className="border-2 border-border bg-card p-12 text-center">
                      <p className="text-2xl font-bold mb-2 text-foreground">
                        Draft Complete!
                      </p>
                      <p className="text-muted-foreground">
                        All {picks.length} picks have been made
                      </p>
                    </div>
                  ) : draft.draftState === 'active' ? (
                    <div className="border-2 border-border border-dashed p-12 text-center">
                      <p className="text-lg text-muted-foreground mb-2">
                        Draft in Progress
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Waiting for{' '}
                        {participants.find(
                          p => p.position === draft.currentPositionOnClock
                        )?.name || 'next player'}{' '}
                        to pick...
                      </p>
                      <div className="mt-6 flex justify-center">
                        <DraftTimer
                          turnStartedAt={draft.turnStartedAt}
                          secondsPerRound={parseInt(draft.secPerRound)}
                          isPaused={draft.timerPaused}
                          variant="compact"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

          {/* Challenge Button - Hidden for now */}
          {/* {isJoined && 
           currentUser && 
           challengeTimeLeft !== null && 
           challengeTimeLeft > 0 && 
           draft.draftState === 'active' && (
            <div className="py-8">
              <div className="max-w-2xl mx-auto">
                <div className="bg-card border-2 border-border p-8 relative overflow-hidden">
                  <GeometricBackground variant="diagonal" opacity={0.05} />
                  <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Challenge window: {challengeTimeLeft}s remaining
                      </span>
                    </div>
                    <BrutalButton
                      onClick={handleChallenge}
                      variant="default"
                      className="w-full py-3 text-lg"
                    >
                      Challenge Last Pick
                    </BrutalButton>
                    <p className="text-xs text-muted-foreground mt-2">
                      Dispute the validity of the previous selection
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* Challenge Voting UI */}
          {draft.draftState === 'challenge' && currentChallenge && (
            <div className="py-8">
              <div className="max-w-2xl mx-auto">
                <div className="bg-card border-2 border-border p-8 relative overflow-hidden">
                  <GeometricBackground variant="diagonal" opacity={0.05} />
                  <div className="relative z-10 text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                      Challenge in Progress
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Pick #{currentChallenge.challengedPickNumber} is being
                      challenged
                    </p>

                    {/* Vote Counts */}
                    {voteCounts && (
                      <div className="mb-6 p-4 bg-muted rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-foreground">
                              Valid Challenge
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                              {voteCounts.validVotes}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              Invalid Challenge
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                              {voteCounts.invalidVotes}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {voteCounts.totalVotes} of {voteCounts.eligibleVoters}{' '}
                          eligible voters
                          {voteCounts.fiftyPercentThreshold && (
                            <span>
                              {' '}
                              • Need {voteCounts.fiftyPercentThreshold} for
                              resolution
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {currentUser &&
                    currentChallenge.challengedUserId !== currentUser.id &&
                    !hasVoted ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Vote on whether this pick should be removed:
                        </p>
                        <div className="flex gap-4 justify-center">
                          <BrutalButton
                            onClick={() => handleVote(true)}
                            variant="filled"
                            className="px-8 py-3"
                          >
                            Valid Challenge
                          </BrutalButton>
                          <BrutalButton
                            onClick={() => handleVote(false)}
                            variant="default"
                            className="px-8 py-3"
                          >
                            Invalid Challenge
                          </BrutalButton>
                        </div>
                      </div>
                    ) : currentUser &&
                      currentChallenge.challengedUserId === currentUser.id ? (
                      <div className="text-muted-foreground">
                        <p>You cannot vote on your own pick</p>
                      </div>
                    ) : hasVoted ? (
                      <div className="text-muted-foreground">
                        <p>You have voted. Waiting for other participants...</p>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <p>Loading vote options...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Draft Board */}
          <div className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Draft Board
              </h2>
              <ViewModeTabs viewMode={viewMode} onChange={setViewMode} />
            </div>
            {picks.length === 0 ? (
              <div className="border-2 border-border border-dashed p-16 text-center">
                <p className="text-lg text-muted-foreground mb-2">
                  {draft.draftState === 'setting_up'
                    ? 'Draft Not Started'
                    : 'No Picks Yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {draft.draftState === 'setting_up'
                    ? `Waiting for ${
                        participants.length < 2
                          ? 'more players'
                          : 'host to start'
                      }`
                    : 'The first pick will appear here'}
                </p>
              </div>
            ) : (
              <div className="max-w-4xl">
                {/* Selections View */}
                {viewMode === 'selections' && (
                  <div className="space-y-8">
                    {roundsData.map((round, roundIndex) => (
                      <div key={roundIndex}>
                        <h3 className="font-bold text-sm mb-3 text-foreground">
                          Round {roundIndex + 1}
                        </h3>
                        <div className="space-y-2">
                          {round.map(pick => (
                            <BrutalListItem
                              key={pick.pickNumber}
                              number={pick.pickNumber}
                              variant="default"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-foreground">
                                  {pick.payload}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  by {pick.clientName}
                                </div>
                              </div>
                            </BrutalListItem>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* By Round View */}
                {viewMode === 'by-round' && (
                  <div className="space-y-8">
                    {Array.from({ length: draft.numRounds }).map(
                      (_, roundIndex) => (
                        <div key={roundIndex}>
                          <h3 className="font-bold text-sm mb-3 text-foreground">
                            Round {roundIndex + 1}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {Array.from({ length: participants.length }).map(
                              (_, pickIndex) => {
                                const pickNumber =
                                  roundIndex * participants.length +
                                  pickIndex +
                                  1
                                const pick = picks.find(
                                  p => p.pickNumber === pickNumber
                                )
                                return (
                                  <DraftPickGrid
                                    key={pickIndex}
                                    pickNumber={pickNumber}
                                    pick={pick}
                                  />
                                )
                              }
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* By Drafter View */}
                {viewMode === 'by-drafter' && (
                  <div className="space-y-8">
                    {drafterData.map(drafter => (
                      <div key={drafter.name}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-sm text-foreground">
                            {drafter.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {drafter.picks.length} pick
                            {drafter.picks.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {drafter.picks.map(pick => {
                            const roundNum = Math.ceil(
                              pick.pickNumber / participants.length
                            )
                            return (
                              <BrutalListItem
                                key={pick.pickNumber}
                                number={pick.pickNumber}
                                variant="minimal"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-foreground">
                                    {pick.payload}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Round {roundNum}
                                  </div>
                                </div>
                              </BrutalListItem>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-80 border-l-2 border-border bg-card">
          {/* Players - Only show when draft is not active */}
          {draft.draftState !== 'active' && (
            <BrutalSection
              title={
                draft.draftState === 'setting_up'
                  ? `PLAYERS: ${participants.length}/${draft.maxDrafters}`
                  : 'Players'
              }
              contentClassName="p-4"
            >
              {participants.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  Waiting for players...
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2"
                    >
                      <span className="font-medium text-sm flex-1 truncate text-foreground">
                        {participant.name}
                      </span>
                      {participant.isReady && (
                        <span className="text-xs bg-muted px-2 py-1 font-medium text-foreground">
                          Ready
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </BrutalSection>
          )}

          {/* Turn Order */}
          {draft.draftState === 'active' && !isReloadingAfterDraftStart && (
            <BrutalSection title="Order" contentClassName="p-4">
              <div className="space-y-1">
                {[...participants]
                  .sort((a, b) => a.position! - b.position!)
                  .map((participant, index) => {
                    const isCurrentTurn =
                      participant.position === draft.currentPositionOnClock
                    return (
                      <div
                        key={participant.id}
                        className={`px-3 py-2 text-sm font-medium flex items-center justify-between ${
                          isCurrentTurn
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <span>
                          {participant.position}. {participant.name}
                        </span>
                        {isCurrentTurn && (
                          <span className="font-bold">NOW</span>
                        )}
                      </div>
                    )
                  })}
              </div>
            </BrutalSection>
          )}

          {/* Actions */}
          <BrutalSection contentClassName="p-4">
            <BrutalButton
              variant="default"
              onClick={handleShareDraft}
              className="w-full"
            >
              Share Draft
            </BrutalButton>
          </BrutalSection>
        </aside>
      </div>
    </div>
  )
}
