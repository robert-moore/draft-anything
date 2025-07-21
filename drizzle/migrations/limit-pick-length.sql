-- Migration: Enforce 300 character limit on draft_selections.payload
ALTER TABLE da.draft_selections
  ALTER COLUMN payload TYPE varchar(300); 