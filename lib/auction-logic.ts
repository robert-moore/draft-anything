import {
  draftAuctionBidsInDa,
  draftCuratedOptionsInDa,
  draftSelectionsInDa,
  draftUsersInDa,
  draftsInDa
} from '@/drizzle/schema'
import { getDraftByGuid } from '@/lib/api/draft-guid-helpers'
import {
  MAX_NOMINATION_LENGTH,
  MIN_BID,
  maxBidForPlayer,
  nextNominatorPosition,
  normalizeNomination,
  rosterSpotsLeft
} from '@/lib/auction'
import { db } from '@/lib/db'
import { getElapsedSeconds, getUtcNow } from '@/lib/time-utils'
import { clearJoinCode } from '@/lib/utils/join-code'
import { and, count, eq, sql } from 'drizzle-orm'

type DraftRow = typeof draftsInDa.$inferSelect
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function lockDraft(tx: Tx, draftId: number): Promise<DraftRow | null> {
  const [draft] = await tx
    .select()
    .from(draftsInDa)
    .where(eq(draftsInDa.id, draftId))
    .for('update')

  return draft ?? null
}

async function getParticipants(tx: Tx, draftId: number) {
  return tx
    .select({
      userId: draftUsersInDa.userId,
      position: draftUsersInDa.position,
      remainingBudget: draftUsersInDa.remainingBudget
    })
    .from(draftUsersInDa)
    .where(eq(draftUsersInDa.draftId, draftId))
}

async function getPickCounts(
  tx: Tx,
  draftId: number
): Promise<Record<string, number>> {
  const rows = await tx
    .select({
      userId: draftSelectionsInDa.userId,
      count: count()
    })
    .from(draftSelectionsInDa)
    .where(eq(draftSelectionsInDa.draftId, draftId))
    .groupBy(draftSelectionsInDa.userId)

  const counts: Record<string, number> = {}
  for (const row of rows) {
    if (row.userId) counts[row.userId] = row.count
  }
  return counts
}

async function getPickCountForUser(
  tx: Tx,
  draftId: number,
  userId: string
): Promise<number> {
  const [row] = await tx
    .select({ count: count() })
    .from(draftSelectionsInDa)
    .where(
      and(
        eq(draftSelectionsInDa.draftId, draftId),
        eq(draftSelectionsInDa.userId, userId)
      )
    )
  return row?.count ?? 0
}

export async function getUsedNominationKeys(
  tx: Tx,
  draftId: number
): Promise<Set<string>> {
  const picks = await tx
    .select({
      payload: draftSelectionsInDa.payload,
      curatedOptionId: draftSelectionsInDa.curatedOptionId
    })
    .from(draftSelectionsInDa)
    .where(eq(draftSelectionsInDa.draftId, draftId))

  const keys = new Set<string>()
  for (const pick of picks) {
    if (pick.payload) keys.add(pick.payload.toLowerCase())
    if (pick.curatedOptionId) keys.add(`option:${pick.curatedOptionId}`)
  }
  return keys
}

function participantList(
  rows: Array<{ userId: string | null; position: number | null }>
) {
  return rows
    .filter(
      (p): p is { userId: string; position: number | null } => p.userId !== null
    )
    .map(p => ({ userId: p.userId, position: p.position }))
}

async function beginNominating(
  tx: Tx,
  draft: DraftRow,
  fromPosition: number
): Promise<void> {
  const participants = await getParticipants(tx, draft.id)
  const pickCounts = await getPickCounts(tx, draft.id)
  const nextPosition = nextNominatorPosition(
    fromPosition,
    participantList(participants),
    pickCounts,
    draft.numRounds
  )

  if (nextPosition === null) {
    await completeAuction(tx, draft.id)
    return
  }

  await tx
    .update(draftsInDa)
    .set({
      draftState: 'active',
      auctionPhase: 'nominating',
      currentPositionOnClock: nextPosition,
      turnStartedAt: getUtcNow(),
      auctionNominatedPayload: null,
      auctionNominatedOptionId: null,
      auctionHighBid: null,
      auctionHighBidderId: null,
      auctionNominatorId: null,
      auctionPassedUserIds: []
    })
    .where(eq(draftsInDa.id, draft.id))
}

async function completeAuction(tx: Tx, draftId: number): Promise<void> {
  await tx
    .update(draftsInDa)
    .set({
      draftState: 'completed',
      auctionPhase: null,
      currentPositionOnClock: null,
      auctionNominatedPayload: null,
      auctionNominatedOptionId: null,
      auctionHighBid: null,
      auctionHighBidderId: null,
      auctionNominatorId: null,
      auctionPassedUserIds: []
    })
    .where(eq(draftsInDa.id, draftId))

  await clearJoinCode(draftId)
}

function passedSet(ids: string[] | null | undefined) {
  return new Set(ids ?? [])
}

export function anyoneElseCanRaise(args: {
  highBid: number
  highBidderId: string
  numRounds: number
  participants: Array<{
    userId: string | null
    remainingBudget: number | null
  }>
  pickCounts: Record<string, number>
  passedUserIds?: string[] | null
}): boolean {
  const minNext = args.highBid + MIN_BID
  const passed = passedSet(args.passedUserIds)
  for (const participant of args.participants) {
    if (!participant.userId || participant.userId === args.highBidderId) {
      continue
    }
    if (passed.has(participant.userId)) continue
    const spots = rosterSpotsLeft(
      args.numRounds,
      args.pickCounts[participant.userId] ?? 0
    )
    const maxBid = maxBidForPlayer(participant.remainingBudget ?? 0, spots)
    if (maxBid >= minNext) return true
  }
  return false
}

export async function awardCurrentLot(
  tx: Tx,
  draft: DraftRow
): Promise<{ awarded: boolean }> {
  if (
    draft.auctionPhase !== 'bidding' ||
    !draft.auctionHighBidderId ||
    draft.auctionHighBid === null
  ) {
    return { awarded: false }
  }

  const [pickCountRow] = await tx
    .select({ count: count() })
    .from(draftSelectionsInDa)
    .where(eq(draftSelectionsInDa.draftId, draft.id))

  if (draft.auctionNominatedOptionId) {
    await tx
      .update(draftCuratedOptionsInDa)
      .set({ isUsed: true })
      .where(eq(draftCuratedOptionsInDa.id, draft.auctionNominatedOptionId))
  }

  await tx.insert(draftSelectionsInDa).values({
    draftId: draft.id,
    userId: draft.auctionHighBidderId,
    pickNumber: pickCountRow.count + 1,
    payload: draft.isFreeform ? draft.auctionNominatedPayload : null,
    curatedOptionId: draft.isFreeform ? null : draft.auctionNominatedOptionId,
    auctionPrice: draft.auctionHighBid,
    wasAutoPick: false,
    createdAt: getUtcNow()
  })

  await tx
    .update(draftUsersInDa)
    .set({
      remainingBudget: sql`${draftUsersInDa.remainingBudget} - ${draft.auctionHighBid}`
    })
    .where(
      and(
        eq(draftUsersInDa.draftId, draft.id),
        eq(draftUsersInDa.userId, draft.auctionHighBidderId)
      )
    )

  const nominatorPosition = draft.currentPositionOnClock ?? 1
  await beginNominating(tx, draft, nominatorPosition)
  return { awarded: true }
}

export async function skipNominator(
  tx: Tx,
  draft: DraftRow
): Promise<void> {
  const from = draft.currentPositionOnClock ?? 1
  await beginNominating(tx, draft, from)
}

export async function autoNominateRandomOption(
  tx: Tx,
  draft: DraftRow
): Promise<{ nominated: boolean }> {
  const unused = await tx
    .select({
      id: draftCuratedOptionsInDa.id,
      optionText: draftCuratedOptionsInDa.optionText
    })
    .from(draftCuratedOptionsInDa)
    .where(
      and(
        eq(draftCuratedOptionsInDa.draftId, draft.id),
        eq(draftCuratedOptionsInDa.isUsed, false)
      )
    )

  if (unused.length === 0) {
    await completeAuction(tx, draft.id)
    return { nominated: false }
  }

  const option = unused[Math.floor(Math.random() * unused.length)]
  const nominator = (
    await tx
      .select({ userId: draftUsersInDa.userId })
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.position, draft.currentPositionOnClock ?? 1)
        )
      )
      .limit(1)
  )[0]

  if (!nominator?.userId) {
    await skipNominator(tx, draft)
    return { nominated: false }
  }

  await placeOpeningBid(tx, draft, {
    userId: nominator.userId,
    openingBid: MIN_BID,
    payload: option.optionText,
    curatedOptionId: option.id
  })
  return { nominated: true }
}

export async function placeOpeningBid(
  tx: Tx,
  draft: DraftRow,
  args: {
    userId: string
    openingBid: number
    payload: string | null
    curatedOptionId: number | null
  }
): Promise<void> {
  const lotNumber = (draft.auctionLotNumber ?? 0) + 1

  await tx.insert(draftAuctionBidsInDa).values({
    draftId: draft.id,
    lotNumber,
    userId: args.userId,
    amount: args.openingBid,
    createdAt: getUtcNow()
  })

  await tx
    .update(draftsInDa)
    .set({
      auctionPhase: 'bidding',
      auctionLotNumber: lotNumber,
      auctionNominatedPayload: args.payload,
      auctionNominatedOptionId: args.curatedOptionId,
      auctionHighBid: args.openingBid,
      auctionHighBidderId: args.userId,
      auctionNominatorId: args.userId,
      auctionPassedUserIds: [],
      turnStartedAt: getUtcNow()
    })
    .where(eq(draftsInDa.id, draft.id))

  const updated: DraftRow = {
    ...draft,
    auctionPhase: 'bidding',
    auctionLotNumber: lotNumber,
    auctionNominatedPayload: args.payload,
    auctionNominatedOptionId: args.curatedOptionId,
    auctionHighBid: args.openingBid,
    auctionHighBidderId: args.userId,
    auctionNominatorId: args.userId,
    auctionPassedUserIds: []
  }

  const participants = await getParticipants(tx, draft.id)
  const pickCounts = await getPickCounts(tx, draft.id)
  if (
    !anyoneElseCanRaise({
      highBid: args.openingBid,
      highBidderId: args.userId,
      numRounds: draft.numRounds,
      participants,
      pickCounts,
      passedUserIds: []
    })
  ) {
    await awardCurrentLot(tx, updated)
  }
}

export async function nominateForAuction(args: {
  draftId: number
  userId: string
  openingBid: number
  payload?: string
  curatedOptionId?: number
}): Promise<{ error?: string; status?: number }> {
  return db.transaction(async tx => {
    const draft = await lockDraft(tx, args.draftId)
    if (!draft) return { error: 'Draft not found', status: 404 }
    if (!draft.isAuction) return { error: 'Not an auction draft', status: 400 }
    if (draft.draftState !== 'active' || draft.auctionPhase !== 'nominating') {
      return { error: 'It is not time to nominate', status: 400 }
    }

    const [nominator] = await tx
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, args.userId)
        )
      )
      .limit(1)

    if (!nominator) {
      return { error: 'You are not a participant in this draft', status: 403 }
    }
    if (nominator.position !== draft.currentPositionOnClock) {
      return { error: 'It is not your turn to nominate', status: 403 }
    }

    const pickCount = await getPickCountForUser(tx, draft.id, args.userId)
    const spots = rosterSpotsLeft(draft.numRounds, pickCount)
    if (spots <= 0) {
      return { error: 'Your roster is full', status: 400 }
    }

    const maxBid = maxBidForPlayer(nominator.remainingBudget ?? 0, spots)
    if (
      !Number.isInteger(args.openingBid) ||
      args.openingBid < MIN_BID ||
      args.openingBid > maxBid
    ) {
      return {
        error: `Opening bid must be between ${MIN_BID} and ${maxBid}`,
        status: 400
      }
    }

    let payload: string | null = null
    let curatedOptionId: number | null = null

    if (draft.isFreeform) {
      const text = normalizeNomination(args.payload || '')
      if (!text) return { error: 'Nomination is required', status: 400 }
      if (text.length > MAX_NOMINATION_LENGTH) {
        return {
          error: `Nomination must be ${MAX_NOMINATION_LENGTH} characters or less`,
          status: 400
        }
      }
      const used = await getUsedNominationKeys(tx, draft.id)
      if (used.has(text.toLowerCase())) {
        return { error: 'That has already been drafted', status: 400 }
      }
      payload = text
    } else {
      if (!args.curatedOptionId) {
        return { error: 'Select an option to nominate', status: 400 }
      }
      const [option] = await tx
        .select()
        .from(draftCuratedOptionsInDa)
        .where(eq(draftCuratedOptionsInDa.id, args.curatedOptionId))
        .limit(1)

      if (!option || option.draftId !== draft.id) {
        return { error: 'Invalid option', status: 400 }
      }
      if (option.isUsed) {
        return { error: 'That option has already been drafted', status: 400 }
      }
      curatedOptionId = option.id
      payload = option.optionText
    }

    await placeOpeningBid(tx, draft, {
      userId: args.userId,
      openingBid: args.openingBid,
      payload,
      curatedOptionId
    })
    return {}
  })
}

export async function bidOnAuction(args: {
  draftId: number
  userId: string
  amount: number
}): Promise<{ error?: string; status?: number }> {
  return db.transaction(async tx => {
    const draft = await lockDraft(tx, args.draftId)
    if (!draft) return { error: 'Draft not found', status: 404 }
    if (!draft.isAuction) return { error: 'Not an auction draft', status: 400 }
    if (draft.draftState !== 'active' || draft.auctionPhase !== 'bidding') {
      return { error: 'There is nothing on the block', status: 400 }
    }
    if (draft.auctionHighBid === null || !draft.auctionHighBidderId) {
      return { error: 'There is nothing on the block', status: 400 }
    }

    const [bidder] = await tx
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, args.userId)
        )
      )
      .limit(1)

    if (!bidder) {
      return { error: 'You are not a participant in this draft', status: 403 }
    }
    if (args.userId === draft.auctionHighBidderId) {
      return { error: 'You already have the high bid', status: 400 }
    }
    if ((draft.auctionPassedUserIds ?? []).includes(args.userId)) {
      return { error: 'You passed on this nomination', status: 400 }
    }

    const pickCount = await getPickCountForUser(tx, draft.id, args.userId)
    const spots = rosterSpotsLeft(draft.numRounds, pickCount)
    if (spots <= 0) {
      return { error: 'Your roster is full', status: 400 }
    }

    const maxBid = maxBidForPlayer(bidder.remainingBudget ?? 0, spots)
    const minNext = draft.auctionHighBid + MIN_BID
    if (
      !Number.isInteger(args.amount) ||
      args.amount < minNext ||
      args.amount > maxBid
    ) {
      return {
        error: `Bid must be between ${minNext} and ${maxBid}`,
        status: 400
      }
    }

    await tx.insert(draftAuctionBidsInDa).values({
      draftId: draft.id,
      lotNumber: draft.auctionLotNumber,
      userId: args.userId,
      amount: args.amount,
      createdAt: getUtcNow()
    })

    await tx
      .update(draftsInDa)
      .set({
        auctionHighBid: args.amount,
        auctionHighBidderId: args.userId,
        turnStartedAt: getUtcNow()
      })
      .where(eq(draftsInDa.id, draft.id))

    const participants = await getParticipants(tx, draft.id)
    const pickCounts = await getPickCounts(tx, draft.id)
    const updated: DraftRow = {
      ...draft,
      auctionHighBid: args.amount,
      auctionHighBidderId: args.userId
    }

    if (
      !anyoneElseCanRaise({
        highBid: args.amount,
        highBidderId: args.userId,
        numRounds: draft.numRounds,
        participants,
        pickCounts,
        passedUserIds: draft.auctionPassedUserIds
      })
    ) {
      await awardCurrentLot(tx, updated)
    }

    return {}
  })
}

export async function passOnAuction(args: {
  draftId: number
  userId: string
}): Promise<{ error?: string; status?: number }> {
  return db.transaction(async tx => {
    const draft = await lockDraft(tx, args.draftId)
    if (!draft) return { error: 'Draft not found', status: 404 }
    if (!draft.isAuction) return { error: 'Not an auction draft', status: 400 }
    if (draft.draftState !== 'active' || draft.auctionPhase !== 'bidding') {
      return { error: 'There is nothing on the block', status: 400 }
    }
    if (draft.auctionHighBid === null || !draft.auctionHighBidderId) {
      return { error: 'There is nothing on the block', status: 400 }
    }
    if (args.userId === draft.auctionHighBidderId) {
      return { error: 'You already have the high bid', status: 400 }
    }

    const [bidder] = await tx
      .select()
      .from(draftUsersInDa)
      .where(
        and(
          eq(draftUsersInDa.draftId, draft.id),
          eq(draftUsersInDa.userId, args.userId)
        )
      )
      .limit(1)

    if (!bidder) {
      return { error: 'You are not a participant in this draft', status: 403 }
    }

    const pickCount = await getPickCountForUser(tx, draft.id, args.userId)
    const spots = rosterSpotsLeft(draft.numRounds, pickCount)
    const maxBid = maxBidForPlayer(bidder.remainingBudget ?? 0, spots)
    const minNext = draft.auctionHighBid + MIN_BID
    if (spots <= 0 || maxBid < minNext) {
      return { error: "You can't raise this bid", status: 400 }
    }

    const alreadyPassed = (draft.auctionPassedUserIds ?? []).includes(
      args.userId
    )
    const passedUserIds = alreadyPassed
      ? (draft.auctionPassedUserIds ?? [])
      : [...(draft.auctionPassedUserIds ?? []), args.userId]

    if (!alreadyPassed) {
      await tx.insert(draftAuctionBidsInDa).values({
        draftId: draft.id,
        lotNumber: draft.auctionLotNumber,
        userId: args.userId,
        amount: 0,
        createdAt: getUtcNow()
      })
      await tx
        .update(draftsInDa)
        .set({ auctionPassedUserIds: passedUserIds })
        .where(eq(draftsInDa.id, draft.id))
    }

    const participants = await getParticipants(tx, draft.id)
    const pickCounts = await getPickCounts(tx, draft.id)
    const updated: DraftRow = {
      ...draft,
      auctionPassedUserIds: passedUserIds
    }

    if (
      !anyoneElseCanRaise({
        highBid: draft.auctionHighBid,
        highBidderId: draft.auctionHighBidderId,
        numRounds: draft.numRounds,
        participants,
        pickCounts,
        passedUserIds
      })
    ) {
      await awardCurrentLot(tx, updated)
    }

    return {}
  })
}

export async function resolveExpiredAuction(
  draftGuid: string
): Promise<boolean> {
  const draft = await getDraftByGuid(draftGuid)
  if (!draft?.isAuction || draft.draftState !== 'active') return false

  const secPerRound = parseInt(draft.secPerRound)
  if (secPerRound === 0 || !draft.turnStartedAt || draft.timerPaused) {
    return false
  }

  const elapsedSeconds = getElapsedSeconds(draft.turnStartedAt)
  if (elapsedSeconds < secPerRound) return false

  return db.transaction(async tx => {
    const locked = await lockDraft(tx, draft.id)
    if (!locked?.isAuction || locked.draftState !== 'active') return false
    if (!locked.turnStartedAt) return false

    const lockedElapsed = getElapsedSeconds(locked.turnStartedAt)
    const lockedSec = parseInt(locked.secPerRound)
    if (lockedElapsed < lockedSec) return false

    if (locked.auctionPhase === 'nominating') {
      if (locked.isFreeform) {
        await skipNominator(tx, locked)
      } else {
        await autoNominateRandomOption(tx, locked)
      }
      return true
    }

    if (locked.auctionPhase === 'bidding') {
      const result = await awardCurrentLot(tx, locked)
      return result.awarded
    }

    return false
  })
}
