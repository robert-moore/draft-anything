DROP SCHEMA da CASCADE;
CREATE SCHEMA IF NOT EXISTS da;

CREATE TYPE da.draft_state AS ENUM (
    'setting_up',
    'active',
    'completed',
    'errored',
    'paused',
    'canceled'
);

CREATE TABLE IF NOT EXISTS da.profiles (
    id UUID PRIMARY KEY, -- REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS da.drafts (
    id SERIAL PRIMARY KEY,
    admin_user_id UUID, -- REFERENCES da.profiles (id),
    name TEXT NOT NULL,
    draft_state da.draft_state NOT NULL,
    max_drafters SMALLINT NOT NULL,
    sec_per_round NUMERIC NOT NULL,
    num_rounds SMALLINT NOT NULL,
    current_position_on_clock SMALLINT,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS da.draft_users (
    draft_id INTEGER REFERENCES da.drafts (id),
    user_id UUID REFERENCES da.profiles (id),
    draft_username TEXT NOT NULL,
    position SMALLINT,
    is_ready BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL
);

ALTER TABLE da.draft_users ADD PRIMARY KEY (draft_id, user_id);

CREATE TABLE IF NOT EXISTS da.draft_selections (
    draft_id INTEGER REFERENCES da.drafts (id),
    user_id UUID REFERENCES da.profiles (id),
    pick_number SMALLINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    payload TEXT NOT NULL
);

ALTER TABLE da.draft_selections ADD PRIMARY KEY (draft_id, user_id, pick_number);

-- The following grants are necessary for the Supabase Realtime feature to work correctly.
-- TODO is there a way to make this more secure?
-- https://github.com/supabase/realtime/issues/1107
GRANT SELECT ON da.drafts TO anon, authenticated;
GRANT SELECT ON da.draft_users TO anon, authenticated;
GRANT SELECT ON da.draft_selections TO anon, authenticated;
