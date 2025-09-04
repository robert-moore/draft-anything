import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  numeric,
  pgSchema,
  primaryKey,
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
  'challenge',
  'challenge_window'
])

export const profilesInDa = da.table('profiles', {
  id: uuid().primaryKey().notNull(),
  name: text().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
})

export const draftsInDa = da.table('drafts', {
  id: serial().primaryKey().notNull(),
  guid: uuid('guid').notNull().unique(),
  adminUserId: uuid('admin_user_id'),
  name: text().notNull(),
  draftState: draftStateInDa('draft_state').notNull(),
  maxDrafters: smallint('max_drafters').notNull(),
  secPerRound: numeric('sec_per_round').notNull(),
  numRounds: smallint('num_rounds').notNull(),
  currentPositionOnClock: smallint('current_position_on_clock'),
  turnStartedAt: timestamp('turn_started_at', { mode: 'string' }),
  timerPaused: boolean('timer_paused').default(false),
  isFreeform: boolean('is_freeform').notNull().default(true),
  joinCode: text('join_code'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull()
})

export const draftCuratedOptionsInDa = da.table(
  'draft_curated_options',
  {
    id: serial().primaryKey().notNull(),
    draftId: integer('draft_id').notNull(),
    optionText: text('option_text').notNull(),
    isUsed: boolean('is_used').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull()
  },
  table => [
    foreignKey({
      columns: [table.draftId],
      foreignColumns: [draftsInDa.id],
      name: 'draft_curated_options_draft_id_fkey'
    })
  ]
)

export const draftUsersInDa = da.table(
  'draft_users',
  {
    draftId: integer('draft_id'),
    userId: uuid('user_id'),
    draftUsername: text('draft_username').notNull(),
    position: smallint(),
    isReady: boolean('is_ready').notNull(),
    isGuest: boolean('is_guest').notNull().default(false),
    autopickEnabled: boolean('autopick_enabled').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull()
  },
  table => [
    foreignKey({
      columns: [table.draftId],
      foreignColumns: [draftsInDa.id],
      name: 'draft_users_draft_id_fkey'
    })
    // Removed foreign key constraint on userId to allow guest users
  ]
)

export const draftSelectionsInDa = da.table(
  'draft_selections',
  {
    draftId: integer('draft_id'),
    userId: uuid('user_id'),
    pickNumber: smallint('pick_number').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
    payload: text(), // Can be null for curated options
    curatedOptionId: integer('curated_option_id'), // Reference to curated option
    wasAutoPick: boolean('was_auto_pick').default(false),
    wasSkipped: boolean('was_skipped').default(false),
    timeTakenSeconds: numeric('time_taken_seconds')
  },
  table => [
    foreignKey({
      columns: [table.draftId],
      foreignColumns: [draftsInDa.id],
      name: 'draft_selections_draft_id_fkey'
    }),
    foreignKey({
      columns: [table.curatedOptionId],
      foreignColumns: [draftCuratedOptionsInDa.id],
      name: 'draft_selections_curated_option_id_fkey'
    }),
    unique('unique_draft_pick_number').on(table.draftId, table.pickNumber)
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
    unique('unique_challenge_vote').on(table.challengeId, table.voterUserId)
  ]
)

export const draftReactionsInDa = da.table(
  'draft_reactions',
  {
    id: serial().primaryKey().notNull(),
    draftId: integer('draft_id').notNull(),
    pickNumber: smallint('pick_number').notNull(),
    userId: uuid('user_id').notNull(),
    emoji: text('emoji'), // allow null for soft delete
    createdAt: timestamp('created_at', { mode: 'string' })
  },
  table => [
    foreignKey({
      columns: [table.draftId, table.pickNumber],
      foreignColumns: [
        draftSelectionsInDa.draftId,
        draftSelectionsInDa.pickNumber
      ],
      name: 'draft_reactions_selection_fkey'
    })
  ]
)


export const draftAutopickQueuesInDa = da.table(
  'draft_autopick_queues',
  {
    draftId: integer('draft_id').notNull(),
    userId: uuid('user_id').notNull(),
    queue: jsonb().notNull().default([]),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
  },
  table => [
    primaryKey({ columns: [table.draftId, table.userId] }),
    foreignKey({
      columns: [table.draftId],
      foreignColumns: [draftsInDa.id],
      name: 'draft_autopick_queues_draft_id_fkey'
    })
  ]
)
