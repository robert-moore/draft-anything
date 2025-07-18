import {
  boolean,
  foreignKey,
  integer,
  numeric,
  pgSchema,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core'

export const da = pgSchema('da')
export const draftStateInDa = da.enum('draft_state', [
  'setting_up',
  'active',
  'completed',
  'errored',
  'paused',
  'canceled',
  'challenge'
])

export const draftSelectionsInDa = da.table(
  'draft_selections',
  {
    draftId: integer('draft_id'),
    userId: uuid('user_id'),
    pickNumber: smallint('pick_number').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
    payload: text().notNull(),
    wasAutoPick: boolean('was_auto_pick').default(false),
    timeTakenSeconds: numeric('time_taken_seconds')
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [profilesInDa.id],
      name: 'draft_selections_user_id_fkey'
    }),
    unique('unique_draft_pick_number').on(table.draftId, table.pickNumber)
  ]
)

export const profilesInDa = da.table('profiles', {
  id: uuid().primaryKey().notNull(),
  name: text().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
})

export const draftsInDa = da.table('drafts', {
  id: serial().primaryKey().notNull(),
  adminUserId: uuid('admin_user_id'),
  name: text().notNull(),
  draftState: draftStateInDa('draft_state').notNull(),
  maxDrafters: smallint('max_drafters').notNull(),
  secPerRound: numeric('sec_per_round').notNull(),
  numRounds: smallint('num_rounds').notNull(),
  currentPositionOnClock: smallint('current_position_on_clock'),
  turnStartedAt: timestamp('turn_started_at', { mode: 'string' }),
  timerPaused: boolean('timer_paused').default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull()
})

export const draftUsersInDa = da.table(
  'draft_users',
  {
    draftId: integer('draft_id'),
    userId: uuid('user_id'),
    draftUsername: text('draft_username').notNull(),
    position: smallint(),
    isReady: boolean('is_ready').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull()
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [profilesInDa.id],
      name: 'draft_users_user_id_fkey'
    })
  ]
)

export const draftChallengeVotesInDa = da.table(
  'draft_challenge_votes',
  {
    id: serial().primaryKey().notNull(),
    challengeId: integer('challenge_id').notNull(),
    voterUserId: uuid('voter_user_id').notNull(),
    vote: boolean().notNull(), // true = valid challenge, false = invalid
    createdAt: timestamp('created_at', { mode: 'string' }).notNull()
  },
  table => [
    foreignKey({
      columns: [table.challengeId],
      foreignColumns: [draftChallengesInDa.id],
      name: 'draft_challenge_votes_challenge_id_fkey'
    }),
    foreignKey({
      columns: [table.voterUserId],
      foreignColumns: [profilesInDa.id],
      name: 'draft_challenge_votes_voter_user_id_fkey'
    }),
    unique('unique_challenge_vote').on(table.challengeId, table.voterUserId)
  ]
)

export const draftChallengesInDa = da.table(
  'draft_challenges',
  {
    id: serial().primaryKey().notNull(),
    draftId: integer('draft_id').notNull(),
    challengedPickNumber: smallint('challenged_pick_number').notNull(),
    challengedUserId: uuid('challenged_user_id').notNull(),
    challengerUserId: uuid('challenger_user_id').notNull(),
    status: text('status').notNull().default('pending'), // pending, resolved, dismissed
    createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
    resolvedAt: timestamp('resolved_at', { mode: 'string' })
  },
  table => [
    foreignKey({
      columns: [table.draftId],
      foreignColumns: [draftsInDa.id],
      name: 'draft_challenges_draft_id_fkey'
    }),
    foreignKey({
      columns: [table.challengedUserId],
      foreignColumns: [profilesInDa.id],
      name: 'draft_challenges_challenged_user_id_fkey'
    }),
    foreignKey({
      columns: [table.challengerUserId],
      foreignColumns: [profilesInDa.id],
      name: 'draft_challenges_challenger_user_id_fkey'
    })
  ]
)
