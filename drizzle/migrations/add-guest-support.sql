-- Add guest support to draft system
-- This allows unauthenticated users to join drafts using a client ID

-- Add is_guest column to draft_users table
ALTER TABLE da.draft_users ADD COLUMN is_guest BOOLEAN NOT NULL DEFAULT false;

-- Add index for performance when querying guests
CREATE INDEX idx_draft_users_is_guest ON da.draft_users(is_guest);

-- The following grants are necessary for the Supabase Realtime feature to work correctly.
-- TODO is there a way to make this more secure?
-- https://github.com/supabase/realtime/issues/1107
-- (No additional grants needed since we're using existing table) 