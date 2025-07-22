'use client'

import { DraftMetadata } from '@/components/draft/draft-metadata'
import { DraftPickGrid } from '@/components/draft/draft-pick-grid'
import { DraftTimer } from '@/components/draft/draft-timer'
import { EmojiReactionsRow } from '@/components/draft/emoji-reactions-row'
import { ViewModeTabs } from '@/components/draft/view-mode-tabs'
import { BrutalButton } from '@/components/ui/brutal-button'
import { BrutalInput } from '@/components/ui/brutal-input'
import { BrutalListItem } from '@/components/ui/brutal-list-item'
import { BrutalSection } from '@/components/ui/brutal-section'
import { CuratedOptionsDropdown } from '@/components/ui/curated-options-dropdown'
import { GeometricBackground } from '@/components/ui/geometric-background'
import { NumberBox } from '@/components/ui/number-box'
import { createClient } from '@/lib/supabase/client'
import type { Draft, DraftPick, Participant } from '@/types/draft'
import { differenceInSeconds, parseISO } from 'date-fns'
import { AlertCircle, Clock, Share } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const supabase = createClient()

// Utility to truncate pick payload
function truncatePickPayload(payload: string, maxLength: number) {
  if (payload.length > maxLength) {
    return payload.slice(0, maxLength) + '...'
  }
  return payload
}

// Hook to get responsive truncation limit
function usePickTruncateLimit() {
  const [limit, setLimit] = useState(150)
  useEffect(() => {
    function updateLimit() {
      if (window.innerWidth < 640) {
        setLimit(30)
      } else {
        setLimit(80)
      }
    }
    updateLimit()
    window.addEventListener('resize', updateLimit)
    return () => window.removeEventListener('resize', updateLimit)
  }, [])
  return limit
}

export default function DraftPage() {
  const pickTruncateLimit = usePickTruncateLimit()
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
  const [isTimerExpired, setIsTimerExpired] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
  const [similarPick, setSimilarPick] = useState<{
    pick: string
    player: string
  } | null>(null)
  const [justSubmittedPick, setJustSubmittedPick] = useState(false)
  const [isOrderFinalized, setIsOrderFinalized] = useState(false)
  const [curatedOptions, setCuratedOptions] = useState<
    Array<{
      id: number
      optionText: string
      isUsed: boolean
    }>
  >([])
  const [showLoading, setShowLoading] = useState(true)
  const [hasRecentSuccessfulChallenge, setHasRecentSuccessfulChallenge] =
    useState(false)
  const [challengeResolvedAfterLastPick, setChallengeResolvedAfterLastPick] =
    useState(false)
  const [challengeWindowTimeLeft, setChallengeWindowTimeLeft] = useState<
    number | null
  >(null)
  const [shouldHideChallengeButtonOnLoad, setShouldHideChallengeButtonOnLoad] =
    useState(false)

  // Add state for all reactions
  type Reaction = {
    id: number
    draftId: number
    pickNumber: number
    userId: string
    userName: string
    emoji: string
    createdAt?: string
  }
  const [reactions, setReactions] = useState<Reaction[]>([])

  const participantsRef = useRef<Participant[]>([])
  const prevPicksLength = useRef<null | number>(null)
  const hasLoadedInitially = useRef(false)

  // Track if subscriptions are already set up to prevent duplicate subscriptions
  const subscriptionsSetUpRef = useRef(false)

  // Function to check for similar picks
  const checkSimilarPick = (input: string) => {
    if (!input.trim()) {
      setSimilarPick(null)
      return
    }

    const normalizedInput = input.toLowerCase().replace(/[^a-z0-9]/g, '')

    for (const pick of picks) {
      const normalizedPick = pick.payload
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')

      // Exact match after normalization
      if (normalizedInput === normalizedPick) {
        setSimilarPick({ pick: pick.payload, player: pick.clientName })
        return
      }

      // Levenshtein distance check (if strings are similar length)
      if (Math.abs(normalizedInput.length - normalizedPick.length) <= 2) {
        const distance = levenshteinDistance(normalizedInput, normalizedPick)
        if (distance <= 1) {
          setSimilarPick({ pick: pick.payload, player: pick.clientName })
          return
        }
      }
    }

    setSimilarPick(null)
  }

  // Levenshtein distance function
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

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
      setCuratedOptions(data.curatedOptions || [])
      setReactions(data.reactions || [])

      // Immediately check if timer is expired ---
      if (
        data.draft &&
        data.draft.draftState === 'active' &&
        data.draft.turnStartedAt &&
        parseInt(data.draft.secPerRound) > 0
      ) {
        const started = parseISO(data.draft.turnStartedAt)
        const elapsed = differenceInSeconds(new Date(), started)
        if (elapsed >= parseInt(data.draft.secPerRound)) {
          setIsTimerExpired(true)
        }
      }

      if (
        data.currentUser &&
        data.participants?.some(
          (p: Participant) => p.id === data.currentUser.id
        )
      ) {
        setIsJoined(true)
      }

      // Check if challenge button should be hidden based on timestamp comparison
      if (data.latestResolvedChallenge && data.picks && data.picks.length > 0) {
        const lastPick = data.picks[data.picks.length - 1]
        const challengeResolvedAt = new Date(
          data.latestResolvedChallenge.resolvedAt
        ).getTime()
        const lastPickCreatedAt = new Date(
          lastPick.createdAt.replace(' ', 'T') + 'Z'
        ).getTime()

        // If the challenge was resolved after the last pick, hide the challenge button
        if (challengeResolvedAt > lastPickCreatedAt) {
          setChallengeResolvedAfterLastPick(true)
        } else {
          setChallengeResolvedAfterLastPick(false)
        }
      } else {
        // No resolved challenge or no picks, show challenge button
        setChallengeResolvedAfterLastPick(false)
      }

      // Load challenge data if draft is in challenge state
      if (data.draft.draftState === 'challenge') {
        await loadChallenge()
      }

      // If we've advanced past the setting up state, set the order to finalized
      if (data.draft.draftState !== 'setting_up') {
        setIsOrderFinalized(true)
      }

      setShouldHideChallengeButtonOnLoad(
        !!data.hasPreviousPickAlreadyBeenChallenged
      )

      // Ensure loading animation completes before hiding loading state
      setTimeout(() => {
        setIsLoading(false)
        setShowLoading(false)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load draft')
      setIsLoading(false)
      setShowLoading(false)
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
      // Only set up subscriptions if we have the draft data with numeric ID
      if (!draft?.id) return

      // Prevent duplicate subscriptions
      if (subscriptionsSetUpRef.current) return
      subscriptionsSetUpRef.current = true

      const draftUsersSub = supabase
        .channel(`draft-users-${draftId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'da',
            table: 'draft_users',
            filter: `draft_id=eq.${draft.id}`
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
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'da',
            table: 'draft_selections',
            filter: `draft_id=eq.${draft.id}`
          },
          payload => {
            // Remove the deleted pick from local state
            setPicks(prev =>
              prev.filter(pick => pick.pickNumber !== payload.old.pick_number)
            )
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
            filter: `draft_id=eq.${draft.id}`
          },
          async payload => {
            const newPick = payload.new

            // For curated options, fetch the option text from local state
            let pickPayload = newPick.payload
            if (newPick.curated_option_id && !newPick.payload) {
              const curatedOption = curatedOptions.find(
                option => option.id === newPick.curated_option_id
              )
              if (curatedOption) {
                pickPayload = curatedOption.optionText
              } else {
                console.error(
                  'Could not find curated option with ID:',
                  newPick.curated_option_id
                )
              }
            }

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
                  payload: pickPayload,
                  createdAt: newPick.created_at
                }
              ]
            })
            setShouldHideChallengeButtonOnLoad(false)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'da',
            table: 'draft_selections',
            filter: `draft_id=eq.${draft.id}`
          },
          payload => {
            // Remove the deleted pick from local state
            setPicks(prev =>
              prev.filter(pick => pick.pickNumber !== payload.old.pick_number)
            )
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
            filter: `id=eq.${draft.id}`
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
              await loadDraft()
            }

            // Handle challenge state changes
            if (updatedState === 'challenge') {
              await loadChallenge()
            } else if (prevState === 'challenge' && updatedState === 'active') {
              // Challenge resolved, reload draft data
              setCurrentChallenge(null)
              setHasVoted(false)
              await loadDraft()
            } else if (updatedState === 'challenge_window') {
              // Entered challenge window, no action needed as timer will handle
            } else if (
              prevState === 'challenge_window' &&
              updatedState === 'completed'
            ) {
              // Challenge window ended, draft completed
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
            filter: `draft_id=eq.${draft.id}`
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
            filter: `draft_id=eq.${draft.id}`
          },
          payload => {
            setCurrentChallenge(payload.new)
            // Hide challenge button when any challenge is resolved (accepted or rejected)
            if (
              payload.new.status === 'resolved' ||
              payload.new.status === 'dismissed'
            ) {
              setChallengeResolvedAfterLastPick(true)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'da',
            table: 'draft_challenges',
            filter: `draft_id=eq.${draft.id}`
          },
          payload => {
            setCurrentChallenge(null)
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

      const draftReactionsSub = supabase
        .channel(`draft-reactions-${draftId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'da',
            table: 'draft_reactions',
            filter: `draft_id=eq.${draft.id}`
          },
          payload => {
            setReactions(prev => {
              const filtered = prev.filter(
                r =>
                  !(
                    r.draftId === payload.new.draft_id &&
                    r.pickNumber === payload.new.pick_number &&
                    r.userId === payload.new.user_id
                  )
              )
              return [
                ...filtered,
                {
                  id: payload.new.id,
                  draftId: payload.new.draft_id,
                  pickNumber: payload.new.pick_number,
                  userId: payload.new.user_id,
                  userName: payload.new.user_name,
                  emoji: payload.new.emoji,
                  createdAt: payload.new.created_at
                }
              ]
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'da',
            table: 'draft_reactions',
            filter: `draft_id=eq.${draft.id}`
          },
          payload => {
            setReactions(prev => {
              const filtered = prev.filter(
                r =>
                  !(
                    r.draftId === payload.new.draft_id &&
                    r.pickNumber === payload.new.pick_number &&
                    r.userId === payload.new.user_id
                  )
              )
              return [
                ...filtered,
                {
                  id: payload.new.id,
                  draftId: payload.new.draft_id,
                  pickNumber: payload.new.pick_number,
                  userId: payload.new.user_id,
                  userName: payload.new.user_name,
                  emoji: payload.new.emoji,
                  createdAt: payload.new.created_at
                }
              ]
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'da',
            table: 'draft_reactions',
            filter: `draft_id=eq.${draft.id}`
          },
          payload => {
            setReactions(prev =>
              prev.filter(
                r =>
                  !(
                    r.draftId === payload.old.draft_id &&
                    r.pickNumber === payload.old.pick_number &&
                    r.userId === payload.old.user_id &&
                    r.emoji === payload.old.emoji
                  )
              )
            )
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
        supabase.removeChannel(draftReactionsSub)
        subscriptionsSetUpRef.current = false
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [draftId, draft?.id])

  // Load draft data and check if already joined
  useEffect(() => {
    loadDraft()
  }, [draftId])

  // Reload draft data when tab becomes visible (in case real-time updates were missed)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && draft?.id) {
        // Small delay to ensure the tab is fully active
        setTimeout(() => {
          loadDraft()
        }, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [draft?.id])

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

  // Calculate challenge window time remaining
  useEffect(() => {
    if (
      !draft ||
      draft.draftState !== 'challenge_window' ||
      !draft.turnStartedAt
    ) {
      setChallengeWindowTimeLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      if (!draft.turnStartedAt) return 0

      try {
        let startTime: number

        // Handle different timestamp formats
        if (draft.turnStartedAt.includes('T')) {
          // Already in ISO format (e.g., '2025-07-21T02:33:37.887+00:00')
          startTime = new Date(draft.turnStartedAt).getTime()
        } else {
          // Database format (e.g., '2025-07-19 14:48:07.297')
          startTime = new Date(
            draft.turnStartedAt.replace(' ', 'T') + 'Z'
          ).getTime()
        }

        // Check if startTime is valid
        if (isNaN(startTime)) {
          return 0
        }

        const now = Date.now()
        const elapsed = now - startTime
        const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000))

        return remaining
      } catch (error) {
        return 0
      }
    }

    // Set initial time
    const initialTime = calculateTimeLeft()
    setChallengeWindowTimeLeft(initialTime)

    // Function to check with backend if challenge window has expired
    const checkChallengeWindowExpiration = async () => {
      try {
        const response = await fetch(
          `/api/drafts/${draftId}/check-challenge-window`,
          {
            method: 'POST'
          }
        )
        if (response.ok) {
          const data = await response.json()
          if (data.expired) {
            // Challenge window expired, reload draft data to get updated state
            await loadDraft()
          }
        }
      } catch (error) {
        console.error('Error checking challenge window expiration:', error)
      }
    }

    // Update every second
    const interval = setInterval(() => {
      const timeLeft = calculateTimeLeft()
      setChallengeWindowTimeLeft(timeLeft)

      if (timeLeft <= 0) {
        setChallengeWindowTimeLeft(null)
        // Check with backend when timer reaches 0
        checkChallengeWindowExpiration()
        clearInterval(interval)
      }
    }, 1000)

    // Also check periodically (every 5 seconds) while challenge window is active
    const checkInterval = setInterval(() => {
      checkChallengeWindowExpiration()
    }, 5000)

    return () => {
      clearInterval(interval)
      clearInterval(checkInterval)
    }
  }, [draft?.draftState, draft?.turnStartedAt])

  // --- Timer/expired state logic ---
  // Helper: is it my turn?
  const isMyTurn =
    isJoined &&
    currentUser &&
    participants.find(p => p.id === currentUser?.id)?.position ===
      draft?.currentPositionOnClock

  // Reset timer expired state when turn changes or draft state changes
  useEffect(() => {
    if (
      draft?.draftState === 'active' &&
      draft?.turnStartedAt &&
      parseInt(draft?.secPerRound) > 0
    ) {
      const started = parseISO(draft.turnStartedAt)
      const elapsed = differenceInSeconds(new Date(), started)
      if (elapsed < parseInt(draft.secPerRound)) {
        setIsTimerExpired(false)
      }
    } else {
      setIsTimerExpired(false)
    }
  }, [draft?.currentPositionOnClock, draft?.draftState, picks.length])

  // Timer expired handler
  const handleTimerExpired = () => {
    setIsTimerExpired(true)
  }

  // Function to check if challenge button should be shown
  const shouldShowChallengeButton = () => {
    // Always show challenge button in challenge window state, except if current user's pick is the last pick
    if (draft?.draftState === 'challenge_window') {
      const lastPick = picks[picks.length - 1]
      return lastPick && lastPick.clientId !== currentUser?.id
    }

    // For active state, use the existing logic but simplified
    if (draft?.draftState === 'active') {
      return !challengeResolvedAfterLastPick && !shouldHideChallengeButtonOnLoad
    }

    return false
  }

  // Update challenge flag when picks change
  useEffect(() => {
    // Don't automatically reset the challenge flag when picks change
    // It will be reset when a new pick is actually submitted
  }, [picks])

  // Reset challenge flag when draft state changes back to active after challenge
  useEffect(() => {
    if (draft?.draftState === 'active' && currentChallenge === null) {
      // Draft is active and no current challenge, so we can reset the flag
      // This happens after a challenge is resolved
      setChallengeResolvedAfterLastPick(false)
      setShouldHideChallengeButtonOnLoad(false)
    }
  }, [draft?.draftState, currentChallenge])

  // Reset challenge flags when a new pick is made after a challenge
  useEffect(() => {
    if (picks.length > 0 && draft?.draftState === 'active') {
      // If we're in active state and have picks, reset challenge flags
      // This ensures challenge button is available for the next pick
      setChallengeResolvedAfterLastPick(false)
      setShouldHideChallengeButtonOnLoad(false)
    }
  }, [draft?.draftState, picks.length])

  // Debug: Log when shouldShowChallengeButton result changes
  useEffect(() => {
    const shouldShow = shouldShowChallengeButton()
  }, [challengeResolvedAfterLastPick, picks.length])

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

      // Immediately add the new participant to local state
      setParticipants(prev => {
        if (prev.some(p => p.id === newParticipant.id)) return prev
        return [
          ...prev,
          {
            id: newParticipant.id,
            name: newParticipant.name,
            position: newParticipant.position,
            isReady: newParticipant.isReady,
            createdAt: newParticipant.createdAt
          }
        ]
      })

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
    if (!currentPick.trim() || !draft) return

    try {
      setJustSubmittedPick(true)

      // For curated options, find the option ID
      let payload = currentPick.trim()
      let curatedOptionId: number | undefined

      if (!draft.isFreeform) {
        const selectedOption = curatedOptions.find(
          option => option.optionText === currentPick.trim()
        )
        if (selectedOption) {
          curatedOptionId = selectedOption.id
          payload = '' // Clear payload for curated options
        }
      }

      const response = await fetch(`/api/drafts/${draftId}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          curatedOptionId
        })
      })

      if (!response.ok) throw new Error('Failed to make pick')

      const newPick = await response.json()
      // Clear the input and similar pick warning after successful pick
      setCurrentPick('')
      setSimilarPick(null)

      // Reset challenge flag since a new pick was made
      setChallengeResolvedAfterLastPick(false)

      // Clear the just submitted state after a short delay to prevent layout shift
      setTimeout(() => {
        setJustSubmittedPick(false)
      }, 1000)
    } catch (err) {
      setJustSubmittedPick(false)
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
        // Show challenge button again if challenge failed
        setChallengeResolvedAfterLastPick(false)
        return
      }

      const data = await response.json()
      setCurrentChallenge(data.challenge)
      setDraft(prev => (prev ? { ...prev, draftState: 'challenge' } : null))

      setChallengeResolvedAfterLastPick(true)
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
      case 'challenge_window':
        return {
          label: 'FINISHING',
          variant: 'filled' as const
        }
      case 'challenge':
        return {
          label: 'CHALLENGE',
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

  if (showLoading) {
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
              <div className="w-full bg-muted h-2 border-2 border-border mb-2 overflow-hidden">
                <div
                  className="bg-foreground h-full transition-all duration-1000 ease-out"
                  style={{
                    width: '0%',
                    animation: 'progressBar 1s ease-out forwards'
                  }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                Connecting to draft server
              </div>
            </div>
          </BrutalSection>
        </div>
        <style jsx>{`
          @keyframes progressBar {
            0% {
              width: 0%;
            }
            50% {
              width: 40%;
            }
            100% {
              width: 100%;
            }
          }
        `}</style>
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

    // Always show the next pick that would be made (never changes when hitting challenge)
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

  // Add a computed boolean for pick length
  const isPickTooLong = currentPick.length > 300

  // Helper to get reactions for a pick
  function getPickReactions(pickNumber: number) {
    return reactions.filter(r => r.pickNumber === pickNumber)
  }
  // Helper to get current user's reactions for a pick
  function getCurrentUserReactions(pickNumber: number) {
    return reactions
      .filter(r => r.pickNumber === pickNumber && r.userId === currentUser?.id)
      .map(r => r.emoji)
  }
  // Helper to check if user can react
  const canReact = isJoined
  // Handler to add/remove reaction
  async function handleReact(
    pickNumber: number,
    emoji: string,
    isActive: boolean
  ) {
    // Optimistically update reactions state
    setReactions(prev => {
      if (!currentUser) return prev
      // Remove any previous reaction for this pick and user
      let filtered = prev.filter(
        r => !(r.pickNumber === pickNumber && r.userId === currentUser.id)
      )
      // If removing (isActive), only remove; if adding, add new reaction
      if (!isActive) {
        filtered = [
          ...filtered,
          {
            id: Math.floor(Math.random() * 1e9), // temp id
            draftId: draft?.id || 0,
            pickNumber,
            userId: currentUser.id,
            userName: currentUser.name || '',
            emoji,
            createdAt: new Date().toISOString()
          }
        ]
      }
      return filtered
    })
    // Send to server
    const url = `/api/drafts/${draftId}/reactions`
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ pickNumber, emoji: isActive ? null : emoji })
    })
    // TODO: Ignore any real-time updates for this user until next reload
  }

  // Build a userId => userName map from participants
  const userIdToName = Object.fromEntries(participants.map(p => [p.id, p.name]))

  return (
    <div className="min-h-screen bg-background">
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
                size="md"
                variant={stateInfo.variant}
                className="px-8 w-auto min-w-[6rem]"
              />
              {/* Mobile Share Button - Only visible on small screens */}
              <div className="lg:hidden ml-auto">
                <BrutalButton
                  variant="text"
                  onClick={handleShareDraft}
                  className="text-sm px-3 py-2"
                >
                  <Share className="w-4 h-4" />
                </BrutalButton>
              </div>
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
                  <span className="font-bold text-foreground">ROUNDS</span>
                  <span className="font-mono text-foreground">
                    {draft.numRounds}
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
            ) : draft.draftState !== 'completed' &&
              draft.draftState !== 'challenge_window' &&
              draft.draftState !== 'challenge' ? (
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
            ) : null}
          </div>

          {/* Last Pick display */}
          {picks.length > 0 && (
            <div className="w-full flex justify-center pt-4 mb-4">
              <span className="text-sm font-medium text-muted-foreground text-center">
                Last Pick: {picks[picks.length - 1].payload} by{' '}
                {picks[picks.length - 1].clientName}
              </span>
            </div>
          )}

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
          {draft.draftState === 'completed' && picks.length > 0 && (
            <div className="py-8">
              <div className="max-w-2xl mx-auto">
                <div className="border-2 border-border bg-card p-12 text-center">
                  <p className="text-2xl font-bold mb-2 text-foreground">
                    Draft Complete!
                  </p>
                  <p className="text-muted-foreground">
                    All {picks.length} picks have been made
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active Pick Input */}
          {draft.draftState === 'active' &&
            isJoined &&
            currentUser &&
            isOrderFinalized &&
            participants.find(p => p.id === currentUser?.id)?.position ===
              draft.currentPositionOnClock &&
            !justSubmittedPick && (
              <div className="py-8">
                <div className="max-w-2xl mx-auto">
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
                            isPaused={draft.timerPaused ?? undefined}
                            variant="full"
                            onExpired={handleTimerExpired}
                          />
                        </div>
                        {/* Autopick delay message */}
                        {parseInt(draft.secPerRound) > 0 && !isTimerExpired && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            If you don't pick in time, an auto-pick will be
                            made. This may take up to a minute.
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {/* Hide input if timer expired */}
                        {!isTimerExpired && (
                          <div>
                            {draft.isFreeform ? (
                              <BrutalInput
                                placeholder="Enter your pick..."
                                value={currentPick}
                                onChange={e => {
                                  setCurrentPick(e.target.value)
                                  checkSimilarPick(e.target.value)
                                }}
                                onKeyDown={e =>
                                  e.key === 'Enter' && handleMakePick()
                                }
                                variant="boxed"
                                className={`w-full bg-card text-foreground text-lg py-3 ${
                                  similarPick
                                    ? 'border-orange-500 dark:border-orange-400 border-2'
                                    : ''
                                }`}
                                autoFocus
                              />
                            ) : (
                              <CuratedOptionsDropdown
                                options={curatedOptions}
                                value={currentPick}
                                onValueChange={setCurrentPick}
                                placeholder="Select your pick..."
                                disabled={false}
                              />
                            )}
                            {similarPick && draft.isFreeform && (
                              <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                                  ⚠️ Note that "{similarPick.pick}" has already
                                  been picked by {similarPick.player}
                                </div>
                              </div>
                            )}
                            {isPickTooLong && (
                              <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="text-sm text-red-700 dark:text-red-300 font-medium">
                                  ⚠️ Pick must be 300 characters or fewer (
                                  {currentPick.length}/300)
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <BrutalButton
                          onClick={handleMakePick}
                          disabled={
                            !currentPick.trim() ||
                            isPickTooLong ||
                            isTimerExpired
                          }
                          variant="filled"
                          className="w-full py-3 text-lg"
                        >
                          {isTimerExpired
                            ? 'Time Expired - Auto-picking...'
                            : 'Submit Pick'}
                        </BrutalButton>
                        {/* Show autopick delay message when timer expired */}
                        {isTimerExpired && (
                          <div className="mt-2 text-xs text-muted-foreground text-center">
                            This may take up to a minute
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Processing Pick */}
          {draft.draftState === 'active' && justSubmittedPick && (
            <div className="py-8">
              <div className="max-w-2xl mx-auto">
                <div className="border-2 border-border border-dashed p-12 text-center">
                  <p className="text-lg text-muted-foreground mb-2">
                    Processing your pick...
                  </p>
                  <div className="mt-6 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muted-foreground"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Waiting for Other Players */}
          {draft.draftState === 'active' &&
            !justSubmittedPick &&
            (!isJoined ||
              !currentUser ||
              !isOrderFinalized ||
              participants.find(p => p.id === currentUser?.id)?.position !==
                draft.currentPositionOnClock) && (
              <div className="py-8">
                <div className="max-w-2xl mx-auto">
                  <div className="border-2 border-border border-dashed p-12 text-center">
                    <p className="text-lg text-muted-foreground mb-2">
                      Draft in Progress
                    </p>
                    {isOrderFinalized ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {isTimerExpired
                            ? 'Autopicking... this may take up to a minute'
                            : `Waiting for ${
                                participants.find(
                                  p =>
                                    p.position === draft.currentPositionOnClock
                                )?.name || 'next player'
                              } to pick...`}
                        </p>
                        <div className="mt-6 flex justify-center">
                          <DraftTimer
                            turnStartedAt={draft.turnStartedAt}
                            secondsPerRound={parseInt(draft.secPerRound)}
                            isPaused={draft.timerPaused ?? undefined}
                            variant="compact"
                            onExpired={handleTimerExpired}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Setting up draft order...
                        </p>
                        <div className="mt-6 flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muted-foreground"></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Challenge Button - Active State */}
          {(() => {
            const shouldShow =
              isJoined &&
              currentUser &&
              draft.isFreeform &&
              shouldShowChallengeButton() &&
              draft.draftState === 'active' &&
              picks.length > 0 &&
              challengeTimeLeft !== null &&
              challengeTimeLeft > 0 &&
              !isTimerExpired

            return shouldShow
          })() && (
            <div className="py-8">
              <div className="max-w-2xl mx-auto">
                <div className="bg-card border-2 border-border p-8 relative overflow-hidden">
                  <GeometricBackground variant="diagonal" opacity={0.05} />
                  <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Time to challenge: {challengeTimeLeft ?? 0}s remaining
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2 border-2 border-border mb-6 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-1000 ease-linear"
                        style={{
                          width: `${((challengeTimeLeft ?? 0) / 30) * 100}%`
                        }}
                      />
                    </div>
                    <BrutalButton
                      onClick={handleChallenge}
                      variant="default"
                      className="w-full py-3 text-lg"
                    >
                      Challenge Last Pick
                    </BrutalButton>
                    <p className="text-xs text-muted-foreground mt-4">
                      Dispute the validity of the previous selection
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Challenge Window - One box for everyone */}
          {(() => {
            const shouldShow =
              isJoined &&
              currentUser &&
              draft.isFreeform &&
              draft.draftState === 'challenge_window' &&
              picks.length > 0 &&
              challengeWindowTimeLeft !== null &&
              challengeWindowTimeLeft > 0

            return shouldShow
          })() && (
            <div className="py-8">
              <div className="max-w-2xl mx-auto">
                <div className="bg-card border-2 border-border p-8 relative overflow-hidden">
                  <GeometricBackground variant="diagonal" opacity={0.05} />
                  <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Challenge window:{' '}
                        {challengeWindowTimeLeft !== null &&
                        challengeWindowTimeLeft >= 0
                          ? `${challengeWindowTimeLeft}s`
                          : '30s'}{' '}
                        remaining
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2 border-2 border-border mb-6 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-1000 ease-linear"
                        style={{
                          width: `${
                            challengeWindowTimeLeft !== null &&
                            challengeWindowTimeLeft >= 0
                              ? (challengeWindowTimeLeft / 30) * 100
                              : 100
                          }%`
                        }}
                      />
                    </div>
                    {picks[picks.length - 1]?.clientId === currentUser.id ? (
                      <p className="text-sm text-muted-foreground">
                        Your pick can be challenged. The draft will end if no
                        challenge is made.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          The last pick can still be challenged.
                        </p>
                        <BrutalButton
                          onClick={handleChallenge}
                          variant="default"
                          className="w-full py-3 text-lg"
                        >
                          Challenge Last Pick
                        </BrutalButton>
                        <p className="text-xs text-muted-foreground mt-4">
                          Dispute the validity of the previous selection
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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

                    {/* Find the challenged pick */}
                    {(() => {
                      const challengedPick = picks.find(
                        p =>
                          p.pickNumber === currentChallenge.challengedPickNumber
                      )
                      return (
                        <div className="mb-6">
                          <p className="text-muted-foreground mb-2">
                            Pick #{currentChallenge.challengedPickNumber} is
                            being challenged by{' '}
                            {currentChallenge.challengerName || 'Unknown'}
                          </p>
                          {challengedPick && (
                            <div className="bg-muted p-4 rounded-lg border border-border">
                              <div className="text-sm text-muted-foreground mb-1">
                                Challenged Pick:
                              </div>
                              <div className="text-lg font-medium text-foreground">
                                "{challengedPick.payload}"
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                by {challengedPick.clientName}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Vote Counts */}
                    {voteCounts && (
                      <div className="mb-6 p-4 bg-muted rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-foreground">
                              Redo Pick
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                              {voteCounts.validVotes}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              Keep Pick
                            </div>
                            <div className="text-2xl font-bold text-green-600">
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
                          Vote on whether this pick should be redone:
                        </p>
                        <div className="flex gap-4 justify-center">
                          <BrutalButton
                            onClick={() => handleVote(false)}
                            variant="default"
                            className="px-6 py-2 text-sm"
                          >
                            Keep Pick
                          </BrutalButton>
                          <BrutalButton
                            onClick={() => handleVote(true)}
                            variant="default"
                            className="px-6 py-2 text-sm"
                          >
                            Redo Pick
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
              <h2 className="text-2xl font-bold text-foreground hidden sm:block">
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
                          {round.map(pick => {
                            const isMyPick = currentUser?.id === pick.clientId
                            return (
                              <BrutalListItem
                                key={pick.pickNumber}
                                variant={isMyPick ? 'highlighted' : 'default'}
                                className="relative"
                              >
                                <div className="absolute top-0 right-0 z-10">
                                  <EmojiReactionsRow
                                    reactions={getPickReactions(
                                      pick.pickNumber
                                    )}
                                    currentUserId={currentUser?.id}
                                    onReact={(emoji, isActive) =>
                                      handleReact(
                                        pick.pickNumber,
                                        emoji,
                                        isActive
                                      )
                                    }
                                    canReact={canReact}
                                    currentUserReactions={getCurrentUserReactions(
                                      pick.pickNumber
                                    )}
                                    inline={true}
                                    userIdToName={userIdToName}
                                    maxEmojis={5}
                                    pickNumber={pick.pickNumber}
                                    pickerName={pick.clientName}
                                    pickContent={pick.payload}
                                  />
                                </div>
                                <div className="flex items-center gap-6 pr-16 sm:pr-12">
                                  <span className="font-mono text-xs text-muted-foreground w-6 text-right">
                                    {pick.pickNumber}
                                  </span>
                                  <div className="flex-1 space-y-1.5">
                                    <div className="font-medium text-foreground flex items-center gap-1">
                                      {truncatePickPayload(
                                        pick.payload,
                                        pickTruncateLimit
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      by {pick.clientName}
                                    </div>
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

                {/* By Round View */}
                {viewMode === 'by-round' && (
                  <div className="space-y-8">
                    {Array.from({ length: draft.numRounds }).map(
                      (_, roundIndex) => (
                        <div key={roundIndex}>
                          <h3 className="font-bold text-sm mb-3 text-foreground">
                            Round {roundIndex + 1}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                                  <div key={pickIndex} className="relative">
                                    <DraftPickGrid
                                      pickNumber={pickNumber}
                                      pick={pick}
                                      currentUserId={currentUser?.id}
                                    />
                                    {pick && (
                                      <div className="absolute top-1 right-1 z-10">
                                        <EmojiReactionsRow
                                          reactions={getPickReactions(
                                            pick.pickNumber
                                          )}
                                          currentUserId={currentUser?.id}
                                          onReact={(emoji, isActive) =>
                                            handleReact(
                                              pick.pickNumber,
                                              emoji,
                                              isActive
                                            )
                                          }
                                          canReact={canReact}
                                          currentUserReactions={getCurrentUserReactions(
                                            pick.pickNumber
                                          )}
                                          inline={true}
                                          userIdToName={userIdToName}
                                          maxEmojis={1}
                                          pickNumber={pick.pickNumber}
                                          pickerName={pick.clientName}
                                          pickContent={pick.payload}
                                        />
                                      </div>
                                    )}
                                  </div>
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
                  <div className="space-y-8 max-w-4xl">
                    {drafterData.map(drafter => {
                      // Check if any of the drafter's picks belong to the current user
                      const isMyDrafter = drafter.picks.some(
                        pick => pick.clientId === currentUser?.id
                      )

                      return (
                        <div key={drafter.name}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
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
                              const isMyPick = pick.clientId === currentUser?.id
                              return (
                                <BrutalListItem
                                  key={pick.pickNumber}
                                  variant={isMyPick ? 'highlighted' : 'default'}
                                  className="relative"
                                >
                                  <div className="absolute top-0 right-0 z-10">
                                    <EmojiReactionsRow
                                      reactions={getPickReactions(
                                        pick.pickNumber
                                      )}
                                      currentUserId={currentUser?.id}
                                      onReact={(emoji, isActive) =>
                                        handleReact(
                                          pick.pickNumber,
                                          emoji,
                                          isActive
                                        )
                                      }
                                      canReact={canReact}
                                      currentUserReactions={getCurrentUserReactions(
                                        pick.pickNumber
                                      )}
                                      inline={true}
                                      userIdToName={userIdToName}
                                      maxEmojis={5}
                                      pickNumber={pick.pickNumber}
                                      pickerName={pick.clientName}
                                      pickContent={pick.payload}
                                    />
                                  </div>
                                  <div className="flex items-center gap-6 pr-16 sm:pr-12">
                                    <span className="font-mono text-xs text-muted-foreground w-6 text-center">
                                      {pick.pickNumber}
                                    </span>
                                    <div className="flex-1 space-y-1.5">
                                      <div className="font-medium text-foreground flex items-center gap-1">
                                        {truncatePickPayload(
                                          pick.payload,
                                          pickTruncateLimit
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Round {roundNum}
                                      </div>
                                    </div>
                                  </div>
                                </BrutalListItem>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Players List - Only show during setup phase on mobile */}
            {draft.draftState === 'setting_up' && (
              <div className="lg:hidden mt-8">
                <div className="text-center">
                  <h3 className="text-sm font-bold text-foreground mb-3">
                    PLAYERS: {participants.length}/{draft.maxDrafters}
                  </h3>
                  {participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Waiting for players...
                    </p>
                  ) : (
                    <p className="text-sm text-foreground">
                      {participants
                        .map(participant => participant.name)
                        .join(', ')}
                    </p>
                  )}
                </div>
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
          {draft.draftState === 'active' && (
            <BrutalSection title="Order" contentClassName="p-4">
              {isOrderFinalized ? (
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
              ) : (
                <div className="space-y-1">
                  {Array.from({ length: participants.length }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 text-sm font-medium flex items-center justify-between text-muted-foreground"
                      >
                        <span className="animate-pulse bg-muted h-4 w-16 rounded"></span>
                        <span className="animate-pulse bg-muted h-4 w-8 rounded"></span>
                      </div>
                    )
                  )}
                </div>
              )}
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
