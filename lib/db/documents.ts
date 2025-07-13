import { eq, and, desc, asc } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { db } from './index'
import { documents, chatDocuments, type Document, type ChatDocument } from './schema'

// Document version interface
export interface DocumentVersion {
  id: string
  title: string
  content: string | null
  kind: string
  userId: string
  createdAt: string
  updatedAt: string
}

// Create a new document
export async function createDocument({
  id,
  title,
  content,
  kind = 'text',
  userId
}: {
  id: string
  title: string
  content?: string
  kind?: 'text' | 'code' | 'react-component' | 'learning-module' | 'assessment'
  userId: string
}): Promise<Document> {
  const [document] = await db.insert(documents).values({
    id,
    title,
    content,
    kind,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }).returning()
  
  return document
}

// Update document content
export async function updateDocument({
  id,
  content
}: {
  id: string
  content: string
}): Promise<Document> {
  const [document] = await db
    .update(documents)
    .set({ 
      content,
      updatedAt: new Date().toISOString()
    })
    .where(eq(documents.id, id))
    .returning()
  
  return document
}

// Get document by ID
export async function getDocument(id: string): Promise<Document | null> {
  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1)
  
  return document || null
}

// Link document to chat (deprecated - use linkDocumentVersionToChat instead)
export async function linkDocumentToChat({
  chatId,
  documentId
}: {
  chatId: string
  documentId: string
}): Promise<ChatDocument> {
  throw new Error('linkDocumentToChat is deprecated. Use linkDocumentVersionToChat with documentCreatedAt instead.')
}

// Get documents for a chat (with versioning support)
export async function getChatDocuments(chatId: string): Promise<Document[]> {
  const results = await db
    .select({
      document: documents
    })
    .from(chatDocuments)
    .innerJoin(
      documents, 
      and(
        eq(chatDocuments.documentId, documents.id),
        eq(chatDocuments.documentCreatedAt, documents.createdAt)
      )
    )
    .where(eq(chatDocuments.chatId, chatId))
    .orderBy(desc(chatDocuments.createdAt))
  
  return results.map(r => r.document)
}

// Get user's documents
export async function getUserDocuments(userId: string): Promise<Document[]> {
  return await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.updatedAt))
}

// VERSION MANAGEMENT FUNCTIONS

// Get latest version of a document
export async function getLatestDocumentVersion(id: string): Promise<Document | null> {
  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .orderBy(desc(documents.createdAt))
    .limit(1)
  
  return document || null
}

// Get all versions of a document
export async function getAllDocumentVersions(id: string): Promise<DocumentVersion[]> {
  return await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .orderBy(asc(documents.createdAt))
}

// Create a new version of an existing document
export async function createDocumentVersion({
  id,
  title,
  content,
  kind = 'text',
  userId
}: {
  id: string // Same ID as previous versions
  title: string
  content?: string
  kind?: 'text' | 'code' | 'react-component' | 'learning-module' | 'assessment'
  userId: string
}): Promise<Document> {
  const [document] = await db.insert(documents).values({
    id,           // Same ID as previous versions
    title,
    content,
    kind,
    userId,
    createdAt: new Date().toISOString(), // New timestamp = new version
    updatedAt: new Date().toISOString()
  }).returning()
  
  return document
}

// Link specific document version to chat
export async function linkDocumentVersionToChat({
  chatId,
  documentId,
  documentCreatedAt
}: {
  chatId: string
  documentId: string
  documentCreatedAt: string
}): Promise<ChatDocument> {
  const [chatDocument] = await db.insert(chatDocuments).values({
    chatId,
    documentId,
    documentCreatedAt,
    createdAt: new Date().toISOString()
  }).returning()
  
  return chatDocument
}

