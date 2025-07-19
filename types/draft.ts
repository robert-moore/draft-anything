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
  maxDrafters: number
  secPerRound: string
  numRounds: number
  currentPositionOnClock: number | null
  turnStartedAt: string | null
  timerPaused: boolean | null
  createdAt: string
}

export interface Participant {
  id: string
  name: string
  position: number | null
  isReady: boolean
  createdAt: string
}

export interface DraftPick {
  pickNumber: number
  clientId: string
  clientName: string
  payload: string
  createdAt: string
  wasAutoPick?: boolean
  timeTakenSeconds?: string
}
