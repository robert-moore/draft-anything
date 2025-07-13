import { relations } from "drizzle-orm/relations";
import { clientsInDa, draftClientsInDa, draftsInDa, draftSelectionsInDa } from "./schema";

export const draftClientsInDaRelations = relations(draftClientsInDa, ({one}) => ({
	clientsInDa: one(clientsInDa, {
		fields: [draftClientsInDa.clientId],
		references: [clientsInDa.id]
	}),
	draftsInDa: one(draftsInDa, {
		fields: [draftClientsInDa.draftId],
		references: [draftsInDa.id]
	}),
}));

export const clientsInDaRelations = relations(clientsInDa, ({many}) => ({
	draftClientsInDas: many(draftClientsInDa),
	draftSelectionsInDas: many(draftSelectionsInDa),
}));

export const draftsInDaRelations = relations(draftsInDa, ({many}) => ({
	draftClientsInDas: many(draftClientsInDa),
	draftSelectionsInDas: many(draftSelectionsInDa),
}));

export const draftSelectionsInDaRelations = relations(draftSelectionsInDa, ({one}) => ({
	clientsInDa: one(clientsInDa, {
		fields: [draftSelectionsInDa.clientId],
		references: [clientsInDa.id]
	}),
	draftsInDa: one(draftsInDa, {
		fields: [draftSelectionsInDa.draftId],
		references: [draftsInDa.id]
	}),
}));