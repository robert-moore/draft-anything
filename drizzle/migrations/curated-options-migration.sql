-- Add is_freeform column to drafts table
ALTER TABLE da.drafts ADD COLUMN is_freeform BOOLEAN NOT NULL DEFAULT true;

-- Create draft_curated_options table
CREATE TABLE da.draft_curated_options (
  id SERIAL PRIMARY KEY,
  draft_id INTEGER NOT NULL,
  option_text TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (draft_id) REFERENCES da.drafts(id)
);

-- Update draft_selections table to support curated options
ALTER TABLE da.draft_selections ADD COLUMN curated_option_id INTEGER;
ALTER TABLE da.draft_selections ALTER COLUMN payload DROP NOT NULL;
ALTER TABLE da.draft_selections ADD FOREIGN KEY (curated_option_id) REFERENCES da.draft_curated_options(id);

-- Add indexes for performance
CREATE INDEX idx_draft_curated_options_draft_id ON da.draft_curated_options(draft_id);
CREATE INDEX idx_draft_curated_options_is_used ON da.draft_curated_options(is_used);
CREATE INDEX idx_draft_selections_curated_option_id ON da.draft_selections(curated_option_id);