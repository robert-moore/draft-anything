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
  uuid
} from 'drizzle-orm/pg-core'

export const da = pgSchema('da')
export const draftStateInDa = da.enum('draft_state', [
  'setting_up',
  'active',
  'completed',
  'errored',
  'paused',
  'canceled'
])

export const draftSelectionsInDa = da.table(
  'draft_selections',
  {
    draftId: integer('draft_id'),
    userId: uuid('user_id'),
    pickNumber: smallint('pick_number').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
    payload: text().notNull()
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [profilesInDa.id],
      name: 'draft_selections_user_id_fkey'
    })
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
  createdAt: timestamp('created_at', { mode: 'string' }).notNull()
})

export const draftUsersInDa = da.table(
  'draft_users',
  {
    draftId: integer('draft_id'),
    userId: uuid('user_id'),
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
