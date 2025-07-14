'use client'

import { DraftMetadata } from '@/components/draft/draft-metadata'
import { DraftPickGrid } from '@/components/draft/draft-pick-grid'
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
import { useEffect, useState } from 'react'

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
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteLink, setShowInviteLink] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [viewMode, setViewMode] = useState<
    'selections' | 'by-round' | 'by-drafter'
  >('selections')

  useEffect(() => {
    const draftUsersSub = supabase
      .channel('debug-any')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'da',
          table: 'draft_users',
          filter: `draft_id=eq.${params.id}`
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

    return () => {
      supabase.removeChannel(draftUsersSub)
    }
  }, [draftId])

  // Load draft data and check if already joined
  useEffect(() => {
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

        if (
          data.currentUser &&
          data.participants?.some(
            (p: Participant) => p.id === data.currentUser.id
          )
        ) {
          setIsJoined(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load draft')
      } finally {
        setIsLoading(false)
      }
    }

    loadDraft()
  }, [draftId])

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
      setPicks(prev => [...prev, newPick])
      setCurrentPick('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make pick')
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
      <div className="min-h-screen bg-white dark:bg-background">
        <div className="border-t-4 border-black dark:border-white bg-white dark:bg-black">
          <div className="flex items-center justify-center py-32">
            <BrutalSection
              variant="bordered"
              className="w-96 text-center"
              background="diagonal"
            >
              <div className="p-8">
                <div className="font-mono text-lg font-bold mb-4 text-black dark:text-white">
                  Loading draft data...
                </div>
                <div className="text-sm opacity-70">
                  {'[' + '█'.repeat(10) + '▒'.repeat(20) + '] 33%'}
                </div>
              </div>
            </BrutalSection>
          </div>
        </div>
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <div className="border-t-4 border-black dark:border-white bg-white dark:bg-black">
          <div className="flex items-center justify-center py-32">
            <BrutalSection variant="bordered" className="w-96 text-center">
              <div className="p-8">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <div className="font-mono text-lg font-bold text-black dark:text-white">
                  {error || 'Draft not found'}
                </div>
              </div>
            </BrutalSection>
          </div>
        </div>
      </div>
    )
  }

  const stateInfo = getStateInfo(draft.draftState)

  // Get current round and pick info
  const getCurrentRoundInfo = () => {
    const totalPicks = picks.length
    const picksPerRound = participants.length
    const currentRound = Math.floor(totalPicks / picksPerRound) + 1
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

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* Draft Header - Primary Visual Anchor */}
      <div className="border-t-4 border-black dark:border-white bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-black tracking-tight text-black dark:text-white">
              {draft.name}
            </h1>
            <NumberBox
              number={stateInfo.label}
              size="sm"
              variant={stateInfo.variant}
              className="px-4"
            />
          </div>
          <DraftMetadata
            players={{ current: participants.length, max: draft.maxDrafters }}
            timer={parseInt(draft.secPerRound)}
            round={{ current: currentRound, total: draft.numRounds }}
            pick={{ current: pickInRound, perRound: participants.length }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex border-t-2 border-black dark:border-white">
        {/* Main Content */}
        <main className="flex-1 px-6 pt-6 bg-white dark:bg-background">
          {/* Join Draft */}
          {!isJoined && draft.draftState === 'setting_up' && (
            <div className="py-8">
              <div className="max-w-xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">
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
          {(draft.draftState === 'active' ||
            (draft.draftState === 'completed' && picks.length > 0)) && (
            <div className="py-8">
              <div className="max-w-2xl mx-auto">
                {isJoined &&
                currentUser &&
                participants[picks.length % participants.length]?.id ===
                  currentUser.id ? (
                  <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-8 relative overflow-hidden">
                    <GeometricBackground variant="diagonal" opacity={0.05} />
                    <div className="relative z-10">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-black dark:text-white">
                          Round {currentRound} - Pick {pickInRound}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          It's your turn to pick
                        </p>
                      </div>
                      <div className="space-y-4">
                        <BrutalInput
                          placeholder="Enter your pick..."
                          value={currentPick}
                          onChange={e => setCurrentPick(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleMakePick()}
                          variant="boxed"
                          className="w-full bg-white dark:bg-black text-black dark:text-white text-lg py-3"
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
                  <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-12 text-center">
                    <p className="text-2xl font-bold mb-2 text-black dark:text-white">
                      Draft Complete!
                    </p>
                    <p className="text-muted-foreground">
                      All {picks.length} picks have been made
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-black dark:border-white border-dashed p-12 text-center">
                    <p className="text-lg text-muted-foreground mb-2">
                      Draft in Progress
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Waiting for{' '}
                      {participants[picks.length % participants.length]?.name ||
                        'next player'}{' '}
                      to pick...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Draft Board */}
          <div className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                Draft Board
              </h2>
              <ViewModeTabs viewMode={viewMode} onChange={setViewMode} />
            </div>
            {picks.length === 0 ? (
              <div className="border-2 border-black dark:border-white border-dashed p-16 text-center">
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
                        <h3 className="font-bold text-sm mb-3 text-black dark:text-white">
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
                                <div className="font-medium text-black dark:text-white">
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
                          <h3 className="font-bold text-sm mb-3 text-black dark:text-white">
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
                          <h3 className="font-bold text-sm text-black dark:text-white">
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
                                  <div className="font-medium text-black dark:text-white">
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
        <aside className="w-80 border-l-2 border-black dark:border-white bg-white dark:bg-black">
          {/* Players */}
          <BrutalSection
            title={`Players (${participants.length}/${draft.maxDrafters})`}
            contentClassName="p-4"
          >
            {participants.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Waiting for players...
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <NumberBox number={index + 1} size="xs" variant="minimal" />
                    <span className="font-medium text-sm flex-1 truncate text-black dark:text-white">
                      {participant.name}
                    </span>
                    {participant.isReady && (
                      <span className="text-xs bg-muted dark:bg-muted/20 px-2 py-1 font-medium text-black dark:text-white">
                        Ready
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </BrutalSection>

          {/* Turn Order */}
          {draft.draftState === 'active' && (
            <BrutalSection title="Turn Order" contentClassName="p-4">
              <div className="space-y-1">
                {participants.map((participant, index) => {
                  const isCurrentTurn =
                    index === (pickInRound - 1) % participants.length
                  return (
                    <div
                      key={participant.id}
                      className={`px-3 py-2 text-sm font-medium flex items-center justify-between ${
                        isCurrentTurn
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <span>
                        {index + 1}. {participant.name}
                      </span>
                      {isCurrentTurn && <span className="font-bold">NOW</span>}
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
