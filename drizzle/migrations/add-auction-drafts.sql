-- Additive auction draft support.
-- Safe to run on existing databases: snake drafts keep working.
-- New columns are nullable or have defaults that leave current rows unchanged.

ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS is_auction BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS starting_budget INTEGER;

ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS auction_phase TEXT;

ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS auction_lot_number SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS auction_nominated_payload TEXT;

ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS auction_nominated_option_id INTEGER
    REFERENCES da.draft_curated_options(id);

ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS auction_high_bid INTEGER;

ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS auction_high_bidder_id UUID;

ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS auction_nominator_id UUID;

ALTER TABLE da.draft_users
  ADD COLUMN IF NOT EXISTS remaining_budget INTEGER;

ALTER TABLE da.draft_selections
  ADD COLUMN IF NOT EXISTS auction_price INTEGER;

CREATE TABLE IF NOT EXISTS da.draft_auction_bids (
  id SERIAL PRIMARY KEY,
  draft_id INTEGER NOT NULL REFERENCES da.drafts(id),
  lot_number SMALLINT NOT NULL,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_draft_auction_bids_draft_lot
  ON da.draft_auction_bids (draft_id, lot_number, created_at);

-- Live bidding. Ignore if this table is already in the publication.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE da.draft_auction_bids;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
