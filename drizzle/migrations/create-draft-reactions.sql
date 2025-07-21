-- Migration: Create draft_reactions table for emoji reactions on picks
CREATE TABLE da.draft_reactions (
  id serial PRIMARY KEY,
  draft_id integer NOT NULL,
  pick_number smallint NOT NULL,
  user_id uuid NOT NULL REFERENCES da.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (draft_id, pick_number, user_id, emoji),
  FOREIGN KEY (draft_id, pick_number)
    REFERENCES da.draft_selections(draft_id, pick_number)
    ON DELETE CASCADE
);

CREATE INDEX idx_draft_reactions_selection ON da.draft_reactions(draft_id, pick_number);
CREATE INDEX idx_draft_reactions_user ON da.draft_reactions(user_id);

-- Grant permissions for realtime
GRANT SELECT, DELETE ON da.draft_reactions TO anon, authenticated; 

ALTER TABLE da.draft_reactions
ADD CONSTRAINT unique_draft_reaction_per_user_per_pick UNIQUE (draft_id, pick_number, user_id); 

ALTER TABLE da.draft_reactions ALTER COLUMN emoji DROP NOT NULL; 