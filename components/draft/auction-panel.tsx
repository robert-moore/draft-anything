'use client'

import { DraftTimer } from '@/components/draft/draft-timer'
import { BrutalButton } from '@/components/ui/brutal-button'
import { BrutalInput } from '@/components/ui/brutal-input'
import { CuratedOptionsDropdown } from '@/components/ui/curated-options-dropdown'
import { GeometricBackground } from '@/components/ui/geometric-background'
import { NumberInput } from '@/components/ui/number-input'
import {
  MIN_BID,
  maxBidForPlayer,
  rosterSpotsLeft
} from '@/lib/auction'
import { createGuestFetch } from '@/lib/guest-utils'
import type { Draft, DraftPick, Participant } from '@/types/draft'
import { useEffect, useMemo, useState } from 'react'

interface AuctionPanelProps {
  draft: Draft
  draftGuid: string
  participants: Participant[]
  picks: DraftPick[]
  currentUserId: string | null
  curatedOptions: Array<{ id: number; optionText: string; isUsed: boolean }>
  onRefresh: () => void
}

export function AuctionPanel({
  draft,
  draftGuid,
  participants,
  picks,
  currentUserId,
  curatedOptions,
  onRefresh
}: AuctionPanelProps) {
  const [nomination, setNomination] = useState('')
  const [openingBid, setOpeningBid] = useState<number | null>(MIN_BID)
  const [bidAmount, setBidAmount] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const me = participants.find(p => p.id === currentUserId)
  const myPickCount = picks.filter(p => p.clientId === currentUserId).length
  const mySpotsLeft = rosterSpotsLeft(draft.numRounds, myPickCount)
  const myMaxBid = maxBidForPlayer(me?.remainingBudget ?? 0, mySpotsLeft)
  const isNominator = me?.position === draft.currentPositionOnClock
  const nominator = participants.find(
    p => p.position === draft.currentPositionOnClock
  )
  const highBidder = participants.find(p => p.id === draft.auctionHighBidderId)
  const nominatedLabel =
    draft.auctionNominatedPayload ||
    curatedOptions.find(o => o.id === draft.auctionNominatedOptionId)
      ?.optionText ||
    'an item'

  const minNextBid = (draft.auctionHighBid ?? 0) + MIN_BID
  const passedUserIds = draft.auctionPassedUserIds ?? []
  const iPassed = !!currentUserId && passedUserIds.includes(currentUserId)

  useEffect(() => {
    setBidAmount(minNextBid)
  }, [minNextBid, draft.auctionHighBid, draft.auctionLotNumber])

  useEffect(() => {
    setError(null)
    setNomination('')
    setOpeningBid(MIN_BID)
  }, [draft.auctionPhase, draft.currentPositionOnClock])

  const similarPick = useMemo(() => {
    if (!draft.isFreeform || !nomination.trim()) return null
    const normalized = nomination.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const pick of picks) {
      const other = pick.payload.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (normalized && normalized === other) {
        return pick
      }
    }
    return null
  }, [draft.isFreeform, nomination, picks])

  const canBid =
    draft.auctionPhase === 'bidding' &&
    !!currentUserId &&
    mySpotsLeft > 0 &&
    currentUserId !== draft.auctionHighBidderId &&
    myMaxBid >= minNextBid &&
    !iPassed

  const handlePass = async () => {
    await submit(`/api/drafts/${draftGuid}/pass`, {})
  }

  const submit = async (url: string, body: unknown) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const guestFetch = createGuestFetch()
      const response = await guestFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNominate = async () => {
    if (openingBid === null || isSubmitting || !nomination.trim()) return
    if (openingBid < MIN_BID || openingBid > myMaxBid || similarPick) return
    const selected = curatedOptions.find(o => o.optionText === nomination)
    await submit(`/api/drafts/${draftGuid}/nominate`, {
      openingBid,
      payload: draft.isFreeform ? nomination : undefined,
      curatedOptionId: draft.isFreeform ? undefined : selected?.id
    })
  }

  const handleBid = async (amount: number) => {
    await submit(`/api/drafts/${draftGuid}/bid`, { amount })
  }

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border-2 border-border p-8 relative overflow-hidden">
          <GeometricBackground variant="diagonal" opacity={0.05} />
          <div className="relative z-10 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">
                {draft.auctionPhase === 'bidding'
                  ? nominatedLabel
                  : isNominator
                    ? 'Nominate something'
                    : `${nominator?.name ?? 'Someone'} is nominating`}
              </h2>
              {draft.auctionPhase === 'bidding' ? (
                <div className="mt-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    High bid
                  </p>
                  <p className="text-5xl font-black text-foreground mt-1">
                    ${draft.auctionHighBid ?? MIN_BID}
                  </p>
                  <p className="text-base font-medium text-foreground mt-1">
                    by {highBidder?.name ?? 'Unknown'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Opening bid starts the lot. Anyone can raise after that.
                </p>
              )}
              <div className="mt-4 flex justify-center">
                <DraftTimer
                  turnStartedAt={draft.turnStartedAt}
                  secondsPerRound={parseInt(draft.secPerRound)}
                  isPaused={draft.timerPaused ?? undefined}
                  variant="full"
                />
              </div>
              {me && (
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="border-2 border-border bg-background px-2 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <span className="hidden lg:inline">Your </span>budget
                    </p>
                    <p className="text-2xl font-black font-mono text-foreground mt-1">
                      ${me.remainingBudget ?? 0}
                    </p>
                  </div>
                  <div className="border-2 border-border bg-background px-2 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <span className="hidden lg:inline">Your </span>roster
                    </p>
                    <p className="text-2xl font-black font-mono text-foreground mt-1">
                      {myPickCount}/{draft.numRounds}
                    </p>
                  </div>
                  <div className="border-2 border-border bg-background px-2 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Max bid
                    </p>
                    <p className="text-2xl font-black font-mono text-foreground mt-1">
                      ${myMaxBid}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {draft.auctionPhase === 'nominating' && isNominator && (
              <div className="space-y-4">
                {draft.isFreeform ? (
                  <BrutalInput
                    placeholder="Nominate something..."
                    value={nomination}
                    onChange={e => setNomination(e.target.value)}
                    onKeyDown={e => {
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      if (
                        isSubmitting ||
                        !nomination.trim() ||
                        openingBid === null ||
                        openingBid < MIN_BID ||
                        openingBid > myMaxBid ||
                        similarPick
                      ) {
                        return
                      }
                      void handleNominate()
                    }}
                    variant="boxed"
                    className="w-full bg-card text-foreground text-lg py-3"
                    autoFocus
                  />
                ) : (
                  <CuratedOptionsDropdown
                    options={curatedOptions}
                    value={nomination}
                    onValueChange={setNomination}
                    placeholder="Select an option to nominate..."
                  />
                )}
                {similarPick && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Similar to {similarPick.payload} (already drafted)
                  </p>
                )}
                <NumberInput
                  id="openingBid"
                  label="Opening bid"
                  value={openingBid}
                  onChange={setOpeningBid}
                  min={MIN_BID}
                  max={Math.max(MIN_BID, myMaxBid)}
                  required={true}
                />
                <BrutalButton
                  onClick={handleNominate}
                  variant="filled"
                  className="w-full"
                  size="lg"
                  disabled={
                    isSubmitting ||
                    !nomination.trim() ||
                    openingBid === null ||
                    openingBid < MIN_BID ||
                    openingBid > myMaxBid ||
                    !!similarPick
                  }
                >
                  {isSubmitting ? 'Nominating...' : 'Nominate'}
                </BrutalButton>
              </div>
            )}

            {draft.auctionPhase === 'bidding' && (
              <div className="space-y-4">
                {canBid ? (
                  <>
                    <NumberInput
                      id="bidAmount"
                      label="Your bid"
                      value={bidAmount}
                      onChange={setBidAmount}
                      min={minNextBid}
                      max={Math.max(minNextBid, myMaxBid)}
                      required={true}
                    />
                    <BrutalButton
                      onClick={() =>
                        bidAmount !== null && handleBid(bidAmount)
                      }
                      variant="filled"
                      className="w-full"
                      size="lg"
                      disabled={
                        isSubmitting ||
                        bidAmount === null ||
                        bidAmount < minNextBid ||
                        bidAmount > myMaxBid
                      }
                    >
                      {isSubmitting
                        ? 'Bidding...'
                        : `Bid $${bidAmount ?? minNextBid}`}
                    </BrutalButton>
                    <BrutalButton
                      onClick={() => void handlePass()}
                      variant="default"
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      Don&apos;t bid
                    </BrutalButton>
                  </>
                ) : iPassed ? (
                  <p className="text-center text-sm text-muted-foreground">
                    You passed on this nomination.
                  </p>
                ) : currentUserId === draft.auctionHighBidderId ? (
                  <p className="text-center text-sm text-muted-foreground">
                    You have the high bid. Waiting on others...
                  </p>
                ) : mySpotsLeft <= 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Your roster is full.
                  </p>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    You can&apos;t raise this bid.
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm font-medium text-destructive text-center">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
