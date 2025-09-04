-- Combined autopick support migration for production
-- Creates autopick queue table and adds autopick support to existing tables

-- Create draft_autopick_queues table with JSONB array storage
-- This uses array-based storage to avoid position conflicts during reordering
CREATE TABLE IF NOT EXISTS da.draft_autopick_queues (
  draft_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  queue JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (draft_id, user_id),
  FOREIGN KEY (draft_id) REFERENCES da.drafts(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_draft_autopick_queues_draft_id ON da.draft_autopick_queues(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_autopick_queues_user_id ON da.draft_autopick_queues(user_id);

-- Add was_skipped column to draft_selections for skip functionality
ALTER TABLE da.draft_selections 
ADD COLUMN IF NOT EXISTS was_skipped BOOLEAN NOT NULL DEFAULT false;

-- Create index for skipped picks
CREATE INDEX IF NOT EXISTS idx_draft_selections_was_skipped ON da.draft_selections(was_skipped);

-- Grant permissions for Supabase Realtime and user actions
-- For draft_autopick_queues
GRANT SELECT ON da.draft_autopick_queues TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON da.draft_autopick_queues TO authenticated;

-- Note: The queue JSONB array contains objects with the following structure:
-- {
--   "id": "unique-identifier",
--   "payload": "text for freeform drafts" (or null),
--   "curatedOptionId": 123 (or null),
--   "isUsed": false
-- }
-- Each user can reorder their queue without conflicts since it's stored as a single array