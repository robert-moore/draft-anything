-- Add challenge state to draft_state enum
ALTER TYPE da.draft_state ADD VALUE 'challenge';

-- Create draft_challenges table
CREATE TABLE da.draft_challenges (
  id SERIAL PRIMARY KEY,
  draft_id INTEGER NOT NULL,
  challenged_pick_number SMALLINT NOT NULL,
  challenged_user_id UUID NOT NULL,
  challenger_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, resolved, dismissed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  FOREIGN KEY (draft_id) REFERENCES da.drafts(id),
  FOREIGN KEY (challenged_user_id) REFERENCES da.profiles(id),
  FOREIGN KEY (challenger_user_id) REFERENCES da.profiles(id)
);

-- Create draft_challenge_votes table
CREATE TABLE da.draft_challenge_votes (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL,
  voter_user_id UUID NOT NULL,
  vote BOOLEAN NOT NULL, -- true = valid challenge, false = invalid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (challenge_id) REFERENCES da.draft_challenges(id),
  FOREIGN KEY (voter_user_id) REFERENCES da.profiles(id),
  UNIQUE(challenge_id, voter_user_id)
);

-- Add indexes for performance
CREATE INDEX idx_draft_challenges_draft_id ON da.draft_challenges(draft_id);
CREATE INDEX idx_draft_challenges_status ON da.draft_challenges(status);
CREATE INDEX idx_draft_challenge_votes_challenge_id ON da.draft_challenge_votes(challenge_id);

-- Add constraint to ensure only one active challenge per draft
CREATE UNIQUE INDEX idx_draft_challenges_active ON da.draft_challenges(draft_id) 
  WHERE status = 'pending'; 

-- The following grants are necessary for the Supabase Realtime feature to work correctly.
-- TODO is there a way to make this more secure?
-- https://github.com/supabase/realtime/issues/1107
GRANT SELECT ON da.draft_challenges TO anon, authenticated;
GRANT SELECT ON da.draft_challenge_votes TO anon, authenticated;