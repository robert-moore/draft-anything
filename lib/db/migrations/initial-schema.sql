-- Document Versioning Migration
-- This implements composite primary key versioning similar to ai-chatbot pattern
-- Documents with same ID but different timestamps = versions

BEGIN;

-- Step 1: Add document_created_at to chat_documents table
ALTER TABLE chat_documents ADD COLUMN document_created_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Populate the new column with existing created_at from documents
UPDATE chat_documents 
SET document_created_at = (
  SELECT created_at FROM documents 
  WHERE documents.id = chat_documents.document_id
);

-- Step 3: Make the column NOT NULL
ALTER TABLE chat_documents ALTER COLUMN document_created_at SET NOT NULL;

-- Step 4: Drop the old foreign key constraint
ALTER TABLE chat_documents DROP CONSTRAINT chat_documents_document_id_documents_id_fk;

-- Step 5: Drop the old primary key from documents
ALTER TABLE documents DROP CONSTRAINT documents_pkey;

-- Step 6: Create new composite primary key (id, created_at)
ALTER TABLE documents ADD PRIMARY KEY (id, created_at);

-- Step 7: Add new foreign key constraint referencing both fields
ALTER TABLE chat_documents 
ADD CONSTRAINT chat_documents_document_composite_fk 
FOREIGN KEY (document_id, document_created_at) 
REFERENCES documents(id, created_at) 
ON DELETE CASCADE;

-- Step 8: Create index for performance on document lookups
CREATE INDEX idx_documents_id_created_at_desc ON documents (id, created_at DESC);

-- Step 9: Create index for latest version queries
CREATE INDEX idx_documents_latest_version ON documents (id, created_at DESC) WHERE created_at IS NOT NULL;

COMMIT;