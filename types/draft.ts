export interface Draft {
  id: number
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
  startTime: string
  currentPositionOnClock: number | null
  turnStartedAt: string | null
  timerPaused: boolean
  createdAt: string
}

export interface Participant {
  id: string
  name: string
  position: number | null
  isReady: boolean
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
