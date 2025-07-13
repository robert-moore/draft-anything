// export const messages = pgTable('messages', {
//   id: uuid('id').primaryKey().notNull().defaultRandom(),
//   chatId: uuid('chat_id')
//     .notNull()
//     .references(() => chats.id, { onDelete: 'cascade' }),
//   role: varchar('role', { length: 256 }).notNull(),
//   parts: json('parts').notNull(), // Stores structured message content (e.g., Vercel AI SDK Message parts)
//   attachments: json('attachments').notNull(),
//   createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
//     .notNull()
//     .defaultNow()
// }).enableRLS()

// export type Message = InferSelectModel<typeof messages>
