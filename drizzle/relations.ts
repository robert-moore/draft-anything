import { relations } from "drizzle-orm/relations";
import { profilesInDa, draftSelectionsInDa, draftUsersInDa } from "./schema";

export const draftSelectionsInDaRelations = relations(draftSelectionsInDa, ({one}) => ({
	profilesInDa: one(profilesInDa, {
		fields: [draftSelectionsInDa.userId],
		references: [profilesInDa.id]
	}),
}));

export const profilesInDaRelations = relations(profilesInDa, ({many}) => ({
	draftSelectionsInDas: many(draftSelectionsInDa),
	draftUsersInDas: many(draftUsersInDa),
}));

export const draftUsersInDaRelations = relations(draftUsersInDa, ({one}) => ({
	profilesInDa: one(profilesInDa, {
		fields: [draftUsersInDa.userId],
		references: [profilesInDa.id]
	}),
}));