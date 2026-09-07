-- Run this if add-auction-drafts.sql was already applied without pass support.
ALTER TABLE da.drafts
  ADD COLUMN IF NOT EXISTS auction_passed_user_ids UUID[] NOT NULL DEFAULT '{}';
