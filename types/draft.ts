export interface Draft {
  id: number // Internal serial ID
  guid: string // External UUID for APIs and URLs
  adminUserId: string | null
  name: string
  draftState:
    | 'setting_up'
    | 'active'
    | 'completed'
    | 'errored'
    | 'paused'
    | 'canceled'
    | 'challenge'
    | 'challenge_window'
  maxDrafters: number
  secPerRound: string
  numRounds: number
  currentPositionOnClock: number | null
  turnStartedAt: string | null
  timerPaused: boolean | null
  isFreeform: boolean
  joinCode: string | null
  createdAt: string
  isAuction: boolean
  startingBudget: number | null
  auctionPhase: 'nominating' | 'bidding' | null
  auctionLotNumber: number
  auctionNominatedPayload: string | null
  auctionNominatedOptionId: number | null
  auctionHighBid: number | null
  auctionHighBidderId: string | null
  auctionNominatorId: string | null
}

export interface Participant {
  id: string
  name: string
  position: number | null
  isReady: boolean
  createdAt: string
  remainingBudget?: number | null
}

export interface DraftPick {
  pickNumber: number
  clientId: string
  clientName: string
  payload: string
  createdAt: string
  wasAutoPick?: boolean
  timeTakenSeconds?: string
  auctionPrice?: number | null
}
