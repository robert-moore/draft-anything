-- Add join_code column to drafts table
ALTER TABLE da.drafts ADD COLUMN join_code TEXT;

-- Create index for efficient lookups by join code
CREATE INDEX idx_drafts_join_code ON da.drafts(join_code);

-- Create unique constraint to ensure join codes are unique when not null
CREATE UNIQUE INDEX idx_drafts_join_code_unique ON da.drafts(join_code) WHERE join_code IS NOT NULL; 