-- Migration: Create draft_chat_room table for chat component
CREATE TABLE da.draft_messages (
    id  bigserial PRIMARY KEY,
    draft_id    integer NOT NULL REFERENCES da.drafts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES da.profiles(id) ON DELETE CASCADE,
    message_content text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE da.draft_messages
    ADD CONSTRAINT message_not_empty
    CHECK (length(trim(message_content)) > 0);

CREATE INDEX inx_draft_messages_draft_created_at
    ON da.draft_messages (draft_id, created_at DESC);

CREATE INDEX inx_draft_messages_user
    ON da.draft_messages (user_id);