-- Remove foreign key constraint that prevents guest users from joining drafts
ALTER TABLE da.draft_users DROP CONSTRAINT IF EXISTS draft_users_user_id_fkey; 
ALTER TABLE da.draft_selections DROP CONSTRAINT IF EXISTS draft_selections_user_id_fkey; 
ALTER TABLE da.draft_challenges DROP CONSTRAINT IF EXISTS draft_challenges_user_id_fkey; 
ALTER TABLE da.draft_challenges DROP CONSTRAINT IF EXISTS draft_challenges_challenger_user_id_fkey; 
ALTER TABLE da.draft_challenge_votes DROP CONSTRAINT IF EXISTS draft_challenge_votes_voter_user_id_fkey;
ALTER TABLE da.draft_reactions DROP CONSTRAINT IF EXISTS draft_reactions_user_id_fkey;