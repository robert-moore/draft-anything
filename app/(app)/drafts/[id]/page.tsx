'use client'

import ChatComponent from '@/components/chat-component'
import { AutoPickMonitor } from '@/components/draft/auto-pick-monitor'
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
import { createClient } from '@/lib/supabase/client'
import type { Draft, DraftPick, Participant } from '@/types/draft'
import { differenceInSeconds, parseISO } from 'date-fns'
import { AlertCircle, ArrowDown, ArrowUp, Clock, Share } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

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
        ...(clientId ? { 'x-client-id': clientId } : {})
      }
    })
  }
}

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

  // Guest state
  const [isGuest, setIsGuest] = useState(false)
  const [clientId, setClientId] = useState<string>('')
  const [showGuestChoice, setShowGuestChoice] = useState(false)

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
  const [isReversed, setIsReversed] = useState(false)
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

  type Message = {
    id: number
    draftId: number
    userId: string
    messageContent: string
    createdAt?: string
  }

  const [messages, setMessages] = useState<Message[]>([])

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
      // Ensure we have a guest client ID available
      const clientId = getGuestClientId()
      if (!isGuest && clientId) {
        setIsGuest(true)
        setClientId(clientId)
      }

      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}`)
      if (!response.ok) {
        if (response.status === 401) {
          // In incognito or when not authenticated, automatically try to join as guest
          if (!isGuest) {
            setIsGuest(true)
            setClientId(getGuestClientId())
            // Try to load draft again with guest credentials
            const guestResponse = await guestFetch(`/api/drafts/${draftId}`)
            if (!guestResponse.ok) {
              setError('Authentication required')
              setIsLoading(false)
              setShowLoading(false)
              return
            }
            // Parse the guest response
            const data = await guestResponse.json()
            setDraft(data.draft)
            setParticipants(data.participants || [])
            setPicks(data.picks || [])
            setCurrentUser(data.currentUser)
            setIsAdmin(data.isAdmin || false)
            setCuratedOptions(data.curatedOptions || [])
            setReactions(data.reactions || [])
            setMessages(data.messages || [])
            setJustSubmittedPick(false)
            setIsLoading(false)
            setShowLoading(false)
            return
          } else {
            setError('Authentication required')
            setIsLoading(false)
            setShowLoading(false)
            return
          }
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
      setMessages(data.messages || [])

      setJustSubmittedPick(false)

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

      // Check if user is joined (either authenticated user or guest)
      const guestClientId = getGuestClientId()
      const isUserJoined =
        (data.currentUser &&
          data.participants?.some(
            (p: Participant) => p.id === data.currentUser.id
          )) ||
        (guestClientId &&
          data.participants?.some((p: Participant) => p.id === guestClientId))

      if (isUserJoined) {
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

      // Initialize challenge window timer if draft is in challenge_window state
      if (
        data.draft.draftState === 'challenge_window' &&
        data.draft.turnStartedAt
      ) {
        // Calculate initial challenge window time remaining
        const calculateTimeLeft = () => {
          if (!data.draft.turnStartedAt) return 0

          try {
            let startTime: number

            // Handle different timestamp formats
            if (data.draft.turnStartedAt.includes('T')) {
              // Already in ISO format (e.g., '2025-07-21T02:33:37.887+00:00')
              startTime = new Date(data.draft.turnStartedAt).getTime()
            } else {
              // Database format with timezone offset (e.g., '2025-07-23 01:17:05.62+00')
              // or without timezone (e.g., '2025-07-19 14:48:07.297')
              let timestamp = data.draft.turnStartedAt
              if (timestamp.includes('+')) {
                // Has timezone offset, convert to ISO format
                // Handle both '+00' and '+00:00' formats
                timestamp = timestamp.replace(' ', 'T')
                if (timestamp.match(/\+[0-9]{2}$/)) {
                  // Format is '+00', convert to '+00:00'
                  timestamp = timestamp.replace(/(\+[0-9]{2})$/, '$1:00')
                }
              } else {
                // No timezone offset, assume UTC
                timestamp = timestamp.replace(' ', 'T') + 'Z'
              }
              startTime = new Date(timestamp).getTime()
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

        const initialTime = calculateTimeLeft()
        // Calculate startTime for debugging using same logic as above
        let debugStartTime: number
        let debugTimestamp: string
        if (data.draft.turnStartedAt.includes('T')) {
          debugTimestamp = data.draft.turnStartedAt
          debugStartTime = new Date(debugTimestamp).getTime()
        } else {
          let timestamp = data.draft.turnStartedAt
          if (timestamp.includes('+')) {
            timestamp = timestamp.replace(' ', 'T')
            if (timestamp.match(/\+[0-9]{2}$/)) {
              // Format is '+00', convert to '+00:00'
              timestamp = timestamp.replace(/(\+[0-9]{2})$/, '$1:00')
            }
          } else {
            timestamp = timestamp.replace(' ', 'T') + 'Z'
          }
          debugTimestamp = timestamp
          debugStartTime = new Date(timestamp).getTime()
        }

        setChallengeWindowTimeLeft(initialTime)

        // If the challenge window has already expired, check with backend to complete the draft
        if (initialTime <= 0) {
          try {
            const response = await fetch(
              `/api/drafts/${draftId}/check-challenge-window`,
              {
                method: 'POST'
              }
            )
            if (response.ok) {
              const checkData = await response.json()
              if (checkData.expired) {
                // Challenge window expired, reload draft data to get updated state
                await loadDraft()
                return
              }
            }
          } catch (error) {
            console.error(
              'Error checking challenge window expiration on load:',
              error
            )
          }
        }
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
      setError(
        (err instanceof Error ? err.message : 'Failed to load draft') +
          '. Please try refreshing the page.'
      )
      setIsLoading(false)
      setShowLoading(false)
    }
  }

  const loadChallenge = async () => {
    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/challenge`)
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
      const guestFetch = createGuestFetch()
      const response = await guestFetch(
        `/api/drafts/${draftId}/challenge/votes`
      )
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
            table: 'draft_users',
            filter: `draft_id=eq.${draft.id}`
          },
          payload => {
            // Remove the deleted participant from local state
            setParticipants(prev =>
              prev.filter(p => p.id !== payload.old.user_id)
            )

            // If the current user was kicked, refresh the page
            const currentUserId = currentUser?.id || getGuestClientId()
            if (payload.old.user_id === currentUserId) {
              window.location.reload()
            }
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

            // Update curated options to mark used options
            if (newPick.curated_option_id) {
              setCuratedOptions(prev =>
                prev.map(option =>
                  option.id === newPick.curated_option_id
                    ? { ...option, isUsed: true }
                    : option
                )
              )
            }

            setShouldHideChallengeButtonOnLoad(false)
            setChallengeResolvedAfterLastPick(false)
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

            if (draft && draft.currentPositionOnClock !== positionOnClock) {
              setJustSubmittedPick(false)
            }

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
              // Entered challenge window, reset timer to ensure proper initialization
              setChallengeWindowTimeLeft(null)
            } else if (
              prevState === 'challenge_window' &&
              updatedState === 'completed'
            ) {
              // Challenge window ended, draft completed
              setChallengeWindowTimeLeft(null)
              await loadDraft()
            } else if (
              prevState === 'challenge_window' &&
              updatedState !== 'challenge_window'
            ) {
              // Left challenge window state, reset timer
              setChallengeWindowTimeLeft(null)
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

      const draftMessagesSub = supabase
        .channel(`draft-messages-${draftId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'da',
            table: 'draft_messages',
            filter: `draft_id=eq.${draft.id}`
          },
          payload => {
            setMessages(prev => {
              const withoutOptimistic = prev.filter(message => {
                const isOptimistic = message.id > 1000000000000
                if (!isOptimistic) return true

                return !(
                  message.messageContent === payload.new.message_content &&
                  message.userId === payload.new.user_id
                )
              })
              return [
                ...withoutOptimistic,
                {
                  id: payload.new.id,
                  draftId: payload.new.draft_id,
                  userId: payload.new.user_id,
                  messageContent: payload.new.message_content,
                  createdAt: payload.new.created_at
                }
              ]
            })
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
        supabase.removeChannel(draftMessagesSub)
        subscriptionsSetUpRef.current = false
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [draftId, draft?.id])

  // Load draft data and check if already joined
  useEffect(() => {
    loadDraft()
  }, [draftId])

  // Poll draft data every 10 seconds, but stop if draft is complete
  useEffect(() => {
    if (!draftId || draft?.draftState === 'completed') return
    const interval = setInterval(() => {
      // If draft becomes complete, stop polling
      if (draft?.draftState === 'completed') {
        clearInterval(interval)
        return
      }
      loadDraft()
    }, 10000) // 10 seconds
    return () => clearInterval(interval)
  }, [draftId, draft?.draftState])

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
          // Database format with timezone offset (e.g., '2025-07-23 01:17:05.62+00')
          // or without timezone (e.g., '2025-07-19 14:48:07.297')
          let timestamp = draft.turnStartedAt
          if (timestamp.includes('+')) {
            // Has timezone offset, convert to ISO format
            // Handle both '+00' and '+00:00' formats
            timestamp = timestamp.replace(' ', 'T')
            if (timestamp.match(/\+[0-9]{2}$/)) {
              // Format is '+00', convert to '+00:00'
              timestamp = timestamp.replace(/(\+[0-9]{2})$/, '$1:00')
            }
          } else {
            // No timezone offset, assume UTC
            timestamp = timestamp.replace(' ', 'T') + 'Z'
          }
          startTime = new Date(timestamp).getTime()
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
    // Calculate startTime for debugging using same logic as above
    let debugStartTime: number
    let debugTimestamp: string
    if (draft.turnStartedAt.includes('T')) {
      debugTimestamp = draft.turnStartedAt
      debugStartTime = new Date(debugTimestamp).getTime()
    } else {
      let timestamp = draft.turnStartedAt
      if (timestamp.includes('+')) {
        timestamp = timestamp.replace(' ', 'T')
        if (timestamp.match(/\+[0-9]{2}$/)) {
          // Format is '+00', convert to '+00:00'
          timestamp = timestamp.replace(/(\+[0-9]{2})$/, '$1:00')
        }
      } else {
        timestamp = timestamp.replace(' ', 'T') + 'Z'
      }
      debugTimestamp = timestamp
      debugStartTime = new Date(timestamp).getTime()
    }

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
        setChallengeWindowTimeLeft(0)
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

  // Change tab title when it's your turn
  useEffect(() => {
    const originalTitle = document.title

    if (isMyTurn && draft?.draftState === 'active') {
      document.title = "⏰ You're on the clock! - Draft Anything"
    } else {
      // Reset to original title when it's not your turn
      document.title = originalTitle
    }

    // Cleanup: restore original title when component unmounts
    return () => {
      document.title = originalTitle
    }
  }, [isMyTurn, draft?.draftState])

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

  // Reset pick state when turn changes
  useEffect(() => {
    if (draft?.draftState === 'active' && isJoined && currentUser) {
      const myPosition = participants.find(
        p => p.id === currentUser?.id
      )?.position
      const isMyTurn = myPosition === draft.currentPositionOnClock

      // If it's not my turn, clear the current pick
      if (!isMyTurn) {
        setCurrentPick('')
        setSimilarPick(null)
      }
    }
  }, [
    draft?.currentPositionOnClock,
    draft?.draftState,
    isJoined,
    currentUser,
    participants
  ])

  // Timer expired handler
  const handleTimerExpired = () => {
    setIsTimerExpired(true)
  }

  // Timer reset handler
  const handleTimerReset = () => {
    setIsTimerExpired(false)
    setJustSubmittedPick(false)
  }

  // Function to check if challenge button should be shown
  const shouldShowChallengeButton = () => {
    // Always show challenge button in challenge window state, except if current user's pick is the last pick
    if (draft?.draftState === 'challenge_window') {
      const lastPick = picks[picks.length - 1]
      const shouldShow = lastPick && lastPick.clientId !== currentUser?.id

      return shouldShow
    }

    // For active state, only use real-time state, not the initial load state
    if (draft?.draftState === 'active') {
      const shouldShow = !challengeResolvedAfterLastPick

      return shouldShow
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
      let response: Response

      // In the case of a guest user creating the draft, they won't see a specific
      // "Join As Guest" button, so we need to check if they're using a guest ID
      const isUsingGuestId = currentUser?.id === getGuestClientId()

      if (isUsingGuestId) {
        // Guest user - use guest join endpoint
        const guestFetch = createGuestFetch()
        const guestClientId = getGuestClientId()
        console.log('joining draft as guest')
        response = await guestFetch(`/api/drafts/${draftId}/join-guest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: playerName.trim(),
            clientId: guestClientId
          })
        })
      } else {
        // Authenticated user - use regular join endpoint
        console.log('joining draft as authenticated user')
        response = await fetch(`/api/drafts/${draftId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: playerName.trim() })
        })
      }

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
      setError(
        (err instanceof Error ? err.message : 'Failed to join draft') +
          '. Please try refreshing the page.'
      )
    }
  }

  const handleJoinAsGuest = async () => {
    if (!playerName.trim()) return

    try {
      const guestClientId = getGuestClientId()
      const response = await fetch(`/api/drafts/${draftId}/join-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName.trim(),
          clientId: guestClientId
        })
      })

      if (!response.ok) throw new Error('Failed to join draft as guest')

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
      setIsGuest(true)
      setClientId(guestClientId)
      setPlayerName('')
      setShowGuestChoice(false)
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : 'Failed to join draft as guest') +
          '. Please try refreshing the page.'
      )
    }
  }

  const handleLeaveDraft = async () => {
    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/leave`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to leave draft')

      setIsJoined(false)
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : 'Failed to leave draft') +
          '. Please try refreshing the page.'
      )
    }
  }

  const handleKickUser = async (userIdToKick: string) => {
    try {
      let response: Response

      if (isGuest) {
        // Guest user (even if they have a currentUser)
        const guestFetch = createGuestFetch()
        response = await guestFetch(`/api/drafts/${draftId}/kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIdToKick })
        })
      } else {
        // Authenticated user only
        response = await fetch(`/api/drafts/${draftId}/kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIdToKick })
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to kick user')
      }

      // The subscription will handle updating the UI state
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : 'Failed to kick user') +
          '. Please try refreshing the page.'
      )
    }
  }

  const handleStartDraft = async () => {
    try {
      let response: Response

      if (isGuest) {
        // Guest user (even if they have a currentUser)
        const guestFetch = createGuestFetch()
        const clientId = getGuestClientId()
        response = await guestFetch(`/api/drafts/${draftId}/start`, {
          method: 'POST'
        })
      } else {
        // Authenticated user only
        response = await fetch(`/api/drafts/${draftId}/start`, {
          method: 'POST'
        })
      }

      if (!response.ok) throw new Error('Failed to start draft')

      setDraft(prev => (prev ? { ...prev, draftState: 'active' } : null))
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : 'Failed to start draft') +
          '. Please try refreshing the page.'
      )
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

      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/pick`, {
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
    } catch (err) {
      setJustSubmittedPick(false)
      setError(
        (err instanceof Error ? err.message : 'Failed to make pick') +
          '. Please try refreshing the page.'
      )
    }
  }

  const handleChallenge = async () => {
    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(`/api/drafts/${draftId}/challenge`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        setError(
          (error.error || 'Failed to initiate challenge') +
            '. Please try refreshing the page.'
        )
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
        (err instanceof Error ? err.message : 'Failed to initiate challenge') +
          '. Please try refreshing the page.'
      )
    }
  }

  const handleVote = async (vote: boolean) => {
    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(
        `/api/drafts/${draftId}/challenge/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        setError(
          (error.error || 'Failed to cast vote') +
            '. Please try refreshing the page.'
        )
        return
      }

      setHasVoted(true)
      await loadVoteCounts() // Refresh vote counts after voting
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : 'Failed to cast vote') +
          '. Please try refreshing the page.'
      )
    }
  }

  const getStateInfo = (state: Draft['draftState']) => {
    switch (state) {
      case 'setting_up':
        return {
          label: 'Setting Up',
          color: 'bg-blue-500 text-white dark:bg-blue-400 dark:text-black',
          pulse: true
        }
      case 'active':
        return {
          label: 'Live',
          color: 'bg-green-500 text-white dark:bg-green-400 dark:text-black',
          pulse: true
        }
      case 'challenge_window':
        return {
          label: 'Last Pick Made',
          color: 'bg-yellow-500 text-black dark:bg-yellow-300 dark:text-black',
          pulse: true
        }
      case 'challenge':
        return {
          label: 'Challenge',
          color: 'bg-orange-500 text-white dark:bg-orange-400 dark:text-black',
          pulse: true
        }
      case 'completed':
        return {
          label: 'Done',
          color: 'bg-gray-400 text-white dark:bg-gray-600 dark:text-white',
          pulse: false
        }
      case 'paused':
        return {
          label: 'Paused',
          color: 'bg-purple-500 text-white dark:bg-purple-400 dark:text-black',
          pulse: false
        }
      case 'canceled':
        return {
          label: 'Canceled',
          color: 'bg-gray-500 text-white dark:bg-gray-400 dark:text-black',
          pulse: false
        }
      default:
        return {
          label: 'Error',
          color: 'bg-red-500 text-white dark:bg-red-400 dark:text-black',
          pulse: false
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
          (err instanceof Error
            ? err.message
            : 'Failed to create invite link') +
            '. Please try refreshing the page.'
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
    // Get current user ID (authenticated user or guest)
    const currentUserId = currentUser?.id || getGuestClientId()
    const currentUserName = currentUser?.name || 'Guest'

    // Optimistically update reactions state
    setReactions(prev => {
      if (!currentUserId) return prev
      // Remove any previous reaction for this pick and user
      let filtered = prev.filter(
        r => !(r.pickNumber === pickNumber && r.userId === currentUserId)
      )
      // If removing (isActive), only remove; if adding, add new reaction
      if (!isActive) {
        filtered = [
          ...filtered,
          {
            id: Math.floor(Math.random() * 1e9), // temp id
            draftId: draft?.id || 0,
            pickNumber,
            userId: currentUserId,
            userName: currentUserName,
            emoji,
            createdAt: new Date().toISOString()
          }
        ]
      }
      return filtered
    })
    // Send to server
    const url = `/api/drafts/${draftId}/reactions`
    const guestFetch = createGuestFetch()
    await guestFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickNumber, emoji: isActive ? null : emoji })
    })
    // TODO: Ignore any real-time updates for this user until next reload
  }

  // Build a userId => userName map from participants
  const userIdToName = Object.fromEntries(participants.map(p => [p.id, p.name]))

  async function handleSendMessage(messageContent: string) {
    if (!messageContent.trim()) return

    const tempId = Date.now()
    const optimisticMessage = {
      id: tempId,
      draftId: draft!.id,
      userId: currentUser?.id || getGuestClientId(),
      messageContent: messageContent.trim(),
      createdAt: new Date().toISOString()
    }

    //show in UI
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const guestFetch = createGuestFetch()
      await guestFetch(`/api/drafts/${draftId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageContent: messageContent.trim() })
      })
    } catch (error) {
      setMessages(prev => prev.filter(message => message.id !== tempId))
      setError('Failed to send message')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className={`max-w-7xl mx-auto flex ${
          isMyTurn && draft?.draftState === 'active' ? 'pb-32' : 'pb-8'
        }`}
      >
        {/* Main Content */}
        <main className="flex-1 px-6 pt-6 bg-background relative">
          {/* State Indicator - Top Right */}
          <div className="absolute right-0 top-0 mt-2 mr-2 z-20 flex items-center gap-2">
            {
              <span
                className={`w-3 h-3 rounded-full inline-block ${stateInfo.color} animate-pulse`}
                aria-label="Draft state indicator"
              ></span>
            }
            <span
              className={`font-semibold text-base ${stateInfo.color} px-3 py-1 rounded-full bg-opacity-80`}
              style={{
                backgroundColor: 'inherit',
                color: 'inherit'
              }}
            >
              {stateInfo.label}
            </span>
          </div>
          {/* Draft Header */}
          <div className="my-8">
            <div className="flex items-center gap-4 mb-4">
              <h1
                className="block w-full text-4xl font-black tracking-tight text-foreground break-words whitespace-pre-line max-w-full sm:max-w-2xl"
                style={{ wordBreak: 'break-word' }}
              >
                {draft.name}
              </h1>
              {/* Removed state tag from here */}
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
              <>
                {/* Join Code Display */}
                {draft.joinCode && (
                  <div className="mb-6 p-4 bg-card border border-border rounded-lg">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        Join Code
                      </h3>
                      <div className="text-3xl font-mono font-bold text-primary mb-2">
                        {draft.joinCode}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share this code with your friends to join via
                        draftanything.io/join
                      </p>
                    </div>
                  </div>
                )}

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
              </>
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
          {picks.length > 0 && draft.draftState !== 'completed' && (
            <div className="w-full flex justify-center pt-4 mb-4">
              <div className="bg-card border border-border rounded-lg px-4 py-2 shadow-sm">
                <span className="text-sm font-medium text-muted-foreground">
                  Last Pick:{' '}
                  <span className="text-foreground font-semibold">
                    {picks[picks.length - 1].payload}
                  </span>{' '}
                  by{' '}
                  <span className="text-foreground font-semibold">
                    {picks[picks.length - 1].clientName}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Join Draft Choice */}
          {!isJoined &&
            draft.draftState === 'setting_up' &&
            !currentUser &&
            !showGuestChoice &&
            !isAdmin && (
              <div className="py-8">
                <div className="max-w-xl mx-auto">
                  <BrutalSection variant="bordered" className="text-center">
                    <div className="p-8">
                      <h2 className="text-2xl font-bold mb-6 text-foreground">
                        Join Draft
                      </h2>
                      <p className="text-muted-foreground mb-8">
                        Choose how you'd like to join this draft
                      </p>

                      <div className="space-y-4">
                        <BrutalButton
                          onClick={() =>
                            (window.location.href = `/auth/login?redirectTo=/drafts/${draftId}`)
                          }
                          variant="filled"
                          className="w-full"
                        >
                          Sign In
                        </BrutalButton>

                        <div className="text-xs text-muted-foreground mb-4">
                          Sign in to join drafts and view your history from any
                          device
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
                          Join as Guest
                        </BrutalButton>
                      </div>
                    </div>
                  </BrutalSection>
                </div>
              </div>
            )}

          {/* Join Draft */}
          {!isJoined &&
            draft.draftState === 'setting_up' &&
            currentUser &&
            currentUser.type === 'user' &&
            !showGuestChoice && (
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

          {/* Join Draft as Guest */}
          {!isJoined &&
            draft.draftState === 'setting_up' &&
            !currentUser &&
            showGuestChoice && (
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
                      onKeyDown={e => e.key === 'Enter' && handleJoinAsGuest()}
                      variant="boxed"
                      className="flex-1"
                      autoFocus
                    />
                    <BrutalButton
                      onClick={handleJoinAsGuest}
                      disabled={!playerName.trim()}
                      variant="filled"
                    >
                      Join
                    </BrutalButton>
                  </div>
                </div>
              </div>
            )}

          {/* Leave Draft */}
          {isJoined && draft.draftState === 'setting_up' && !isAdmin && (
            <div className="py-8">
              <div className="max-w-xl mx-auto">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    You're joined as{' '}
                    <span className="font-semibold text-foreground">
                      {(() => {
                        const guestClientId = getGuestClientId()
                        const participant = participants.find(
                          p =>
                            p.id === currentUser?.id || p.id === guestClientId
                        )
                        return participant?.name || 'Unknown'
                      })()}
                    </span>
                  </p>
                  <BrutalButton
                    onClick={handleLeaveDraft}
                    variant="default"
                    className="px-6"
                  >
                    Leave Draft
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
            isOrderFinalized &&
            (() => {
              const guestClientId = getGuestClientId()
              const participant = participants.find(
                p => p.id === currentUser?.id || p.id === guestClientId
              )
              return participant?.position === draft.currentPositionOnClock
            })() &&
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
                            onReset={handleTimerReset}
                          />
                        </div>
                        {/* Autopick delay message */}
                        {parseInt(draft.secPerRound) > 0 && !isTimerExpired && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            If you don't pick in time, a random auto-pick will
                            be made. That may take up to a minute.
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
                            onReset={handleTimerReset}
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

          {/* Curated Options Preview - Show when not your turn but draft is active */}
          {draft.draftState === 'active' &&
            !justSubmittedPick &&
            isJoined &&
            currentUser &&
            isOrderFinalized &&
            !draft.isFreeform &&
            participants.find(p => p.id === currentUser?.id)?.position !==
              draft.currentPositionOnClock && (
              <div className="py-8">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-card border-2 border-border p-8 relative overflow-hidden">
                    <GeometricBackground variant="diagonal" opacity={0.05} />
                    <div className="relative z-10">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-foreground">
                          Preview Options
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          You can browse options, but can't submit until your
                          turn
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <CuratedOptionsDropdown
                            options={curatedOptions}
                            value={currentPick}
                            onValueChange={setCurrentPick}
                            placeholder="Browse options..."
                            disabled={false}
                          />
                        </div>
                        <BrutalButton
                          disabled={true}
                          variant="filled"
                          className="w-full py-3 text-lg opacity-50"
                        >
                          Not Your Turn
                        </BrutalButton>
                      </div>
                    </div>
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
              picks.length > 0

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
                        {challengeWindowTimeLeft !== null &&
                        challengeWindowTimeLeft > 0 ? (
                          <>
                            Challenge window: {challengeWindowTimeLeft}s
                            remaining
                          </>
                        ) : challengeWindowTimeLeft === 0 ? (
                          <>
                            Challenge window expired - checking with server...
                          </>
                        ) : (
                          <>Challenge window active - initializing timer...</>
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2 border-2 border-border mb-6 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-1000 ease-linear"
                        style={{
                          width: `${Math.max(
                            0,
                            ((challengeWindowTimeLeft ?? 0) / 30) * 100
                          )}%`
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

                    {/* Vote Counts - Always show if joined (including guests) */}
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
                      isJoined && (
                        <div className="text-muted-foreground">
                          <p>Loading vote options...</p>
                        </div>
                      )
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
              <div className="flex items-center gap-4">
                <ViewModeTabs viewMode={viewMode} onChange={setViewMode} />
                {(viewMode === 'selections' || viewMode === 'by-round') && (
                  <button
                    onClick={() => setIsReversed(!isReversed)}
                    className="text-xs px-3 py-1 border border-border rounded hover:bg-accent transition-all duration-300 ease-out transform hover:scale-105 flex items-center gap-1"
                  >
                    {isReversed ? (
                      <ArrowUp className="w-3 h-3 transition-transform duration-300 ease-out" />
                    ) : (
                      <ArrowDown className="w-3 h-3 transition-transform duration-300 ease-out" />
                    )}
                  </button>
                )}
              </div>
            </div>
            {picks.length === 0 ? (
              <div className="max-w-2xl mx-auto">
                <div className="border-2 border-border border-dashed p-16 text-center">
                  <p className="text-lg text-muted-foreground mb-2">
                    {draft.draftState === 'setting_up'
                      ? 'Draft Not Started'
                      : draft.draftState === 'canceled'
                      ? 'Draft Canceled'
                      : 'No Picks Yet'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {draft.draftState === 'setting_up'
                      ? `Waiting for ${
                          participants.length < 2
                            ? 'more players'
                            : 'host to start'
                        }`
                      : draft.draftState === 'canceled'
                      ? 'This draft was never started'
                      : 'The first pick will appear here'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl">
                {/* Selections View */}
                {viewMode === 'selections' && (
                  <div className="space-y-8">
                    {(isReversed ? [...roundsData].reverse() : roundsData).map(
                      (round, roundIndex) => (
                        <div
                          key={`round-${
                            isReversed
                              ? roundsData.length - roundIndex
                              : roundIndex + 1
                          }`}
                          className="transition-all duration-700 ease-out"
                        >
                          <h3 className="font-bold text-sm mb-3 text-foreground">
                            Round{' '}
                            {isReversed
                              ? roundsData.length - roundIndex
                              : roundIndex + 1}
                          </h3>
                          <div className="space-y-2">
                            {(isReversed ? [...round].reverse() : round).map(
                              (pick, pickIndex) => {
                                const isMyPick =
                                  currentUser?.id === pick.clientId
                                return (
                                  <BrutalListItem
                                    key={`pick-${pick.pickNumber}-${
                                      isReversed
                                        ? round.length - pickIndex
                                        : pickIndex + 1
                                    }`}
                                    variant={
                                      isMyPick ? 'highlighted' : 'default'
                                    }
                                    className="relative transition-all duration-500 ease-out transform"
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
                              }
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* By Round View */}
                {viewMode === 'by-round' && (
                  <div className="space-y-8">
                    {(isReversed
                      ? Array.from({ length: draft.numRounds }).reverse()
                      : Array.from({ length: draft.numRounds })
                    ).map((_, roundIndex) => (
                      <div
                        key={`round-${
                          isReversed
                            ? draft.numRounds - roundIndex
                            : roundIndex + 1
                        }`}
                        className="transition-all duration-700 ease-out"
                      >
                        <h3 className="font-bold text-sm mb-3 text-foreground">
                          Round{' '}
                          {isReversed
                            ? draft.numRounds - roundIndex
                            : roundIndex + 1}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {Array.from({ length: participants.length }).map(
                            (_, pickIndex) => {
                              const actualRoundIndex = isReversed
                                ? draft.numRounds - 1 - roundIndex
                                : roundIndex
                              const pickNumber =
                                actualRoundIndex * participants.length +
                                pickIndex +
                                1
                              const pick = picks.find(
                                p => p.pickNumber === pickNumber
                              )
                              return (
                                <div
                                  key={`pick-${pickNumber}-${
                                    isReversed
                                      ? participants.length - pickIndex
                                      : pickIndex + 1
                                  }`}
                                  className="relative transition-all duration-500 ease-out transform"
                                >
                                  <DraftPickGrid
                                    pickNumber={pickNumber}
                                    pick={pick}
                                    currentUserId={currentUser?.id}
                                  />
                                  {pick && (
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
                    ))}
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
                        <div
                          key={drafter.name}
                          className="transition-all duration-700 ease-out"
                        >
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
                            {drafter.picks.map((pick, pickIndex) => {
                              const roundNum = Math.ceil(
                                pick.pickNumber / participants.length
                              )
                              const isMyPick = pick.clientId === currentUser?.id
                              return (
                                <BrutalListItem
                                  key={`pick-${pick.pickNumber}-${
                                    pickIndex + 1
                                  }`}
                                  variant={isMyPick ? 'highlighted' : 'default'}
                                  className="relative transition-all duration-500 ease-out transform"
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
                    <div className="space-y-2">
                      {participants.map((participant, index) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 bg-card border border-border rounded"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium text-foreground">
                              {participant.name}
                            </span>
                          </div>
                          {isAdmin &&
                            participant.id !== currentUser?.id &&
                            participant.id !== getGuestClientId() && (
                              <button
                                onClick={() => handleKickUser(participant.id)}
                                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-100 px-2 py-1 font-medium rounded transition-colors"
                                title="Kick player"
                              >
                                Kick
                              </button>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Order List - Show during active phase on mobile */}
            {draft.draftState === 'active' && (
              <div className="lg:hidden mt-8">
                <div className="text-center">
                  <h3 className="text-sm font-bold text-foreground mb-3">
                    ORDER
                  </h3>
                  {isOrderFinalized ? (
                    <div className="space-y-1">
                      {[...participants]
                        .sort((a, b) => a.position! - b.position!)
                        .map((participant, index) => {
                          const isCurrentTurn =
                            participant.position ===
                            draft.currentPositionOnClock
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
                      {isAdmin &&
                        draft.draftState === 'setting_up' &&
                        participant.id !== currentUser?.id &&
                        participant.id !== getGuestClientId() && (
                          <button
                            onClick={() => handleKickUser(participant.id)}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-100 px-2 py-1 font-medium rounded transition-colors"
                            title="Kick player"
                          >
                            Kick
                          </button>
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
              Invite Friends
            </BrutalButton>
          </BrutalSection>
          {/* CHAT  */}
          <BrutalSection
            variant="bordered"
            className="text-center m-2"
            background="diagonal"
          >
            <ChatComponent
              draftId={draftId}
              currentUser={currentUser?.id || getGuestClientId() || null}
              messages={messages}
              userIdToName={userIdToName}
              onSendMessage={handleSendMessage}
            />
          </BrutalSection>
        </aside>
      </div>

      {/* Sticky "You're on the clock" footer */}
      {isMyTurn && draft?.draftState === 'active' && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border z-50 h-20 flex items-center">
          <div className="max-w-7xl mx-auto flex items-center justify-between w-full px-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-foreground">
                You're on the clock!
              </span>
            </div>
            <DraftTimer
              turnStartedAt={draft.turnStartedAt}
              secondsPerRound={parseInt(draft.secPerRound)}
              isPaused={draft.timerPaused ?? undefined}
              variant="compact"
              onExpired={handleTimerExpired}
              onReset={handleTimerReset}
            />
          </div>
        </div>
      )}

      {/* Auto-pick monitor */}
      {draft?.draftState === 'active' && isJoined && currentUser && (
        <AutoPickMonitor
          draftId={draftId}
          turnStartedAt={draft.turnStartedAt}
          secondsPerRound={parseInt(draft.secPerRound)}
          isMyTurn={isMyTurn}
          currentPickNumber={picks.length + 1}
        />
      )}
    </div>
  )
}

/* Add this to the bottom of the file for custom pulse if needed */
;<style jsx global>{`
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  .animate-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`}</style>
