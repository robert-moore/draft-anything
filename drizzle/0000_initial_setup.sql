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
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS da.draft_users (
    draft_id INTEGER, -- REFERENCES da.drafts (id),
    user_id UUID REFERENCES da.profiles (id),
    position SMALLINT,
    is_ready BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS da.draft_selections (
    draft_id INTEGER, -- REFERENCES da.drafts (id),
    user_id UUID REFERENCES da.profiles (id),
    pick_number SMALLINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    payload TEXT NOT NULL
);