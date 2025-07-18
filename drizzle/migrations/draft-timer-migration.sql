-- Add timer functionality to drafts
ALTER TABLE drafts 
  ADD COLUMN turn_started_at TIMESTAMPTZ,
  ADD COLUMN timer_paused BOOLEAN DEFAULT false;

-- Add auto-pick tracking to selections
ALTER TABLE draft_selections 
  ADD COLUMN was_auto_pick BOOLEAN DEFAULT false,
  ADD COLUMN time_taken_seconds NUMERIC;

-- Ensure one pick per turn
ALTER TABLE draft_selections 
  ADD CONSTRAINT unique_draft_pick_number UNIQUE (draft_id, pick_number);

-- Index for active drafts with timers
CREATE INDEX idx_drafts_active_timer ON drafts(id) 
  WHERE draft_state = 'active' AND turn_started_at IS NOT NULL;