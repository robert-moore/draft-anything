import { pgTable, pgSchema, serial, text, smallint, numeric, timestamp, foreignKey, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const da = pgSchema("da");
export const draftStateInDa = da.enum("draft_state", ['setting_up', 'active', 'completed', 'errored', 'paused', 'canceled'])


export const draftsInDa = da.table("drafts", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	draftState: draftStateInDa("draft_state").notNull(),
	maxDrafters: smallint("max_drafters").notNull(),
	secPerRound: numeric("sec_per_round").notNull(),
	numRounds: smallint("num_rounds").notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
});

export const clientsInDa = da.table("clients", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
});

export const draftClientsInDa = da.table("draft_clients", {
	draftId: integer("draft_id"),
	clientId: text("client_id"),
	position: smallint(),
	isReady: boolean("is_ready").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clientsInDa.id],
			name: "draft_clients_client_id_fkey"
		}),
	foreignKey({
			columns: [table.draftId],
			foreignColumns: [draftsInDa.id],
			name: "draft_clients_draft_id_fkey"
		}),
]);

export const draftSelectionsInDa = da.table("draft_selections", {
	draftId: integer("draft_id"),
	clientId: text("client_id"),
	pickNumber: smallint("pick_number").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	payload: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clientsInDa.id],
			name: "draft_selections_client_id_fkey"
		}),
	foreignKey({
			columns: [table.draftId],
			foreignColumns: [draftsInDa.id],
			name: "draft_selections_draft_id_fkey"
		}),
]);
