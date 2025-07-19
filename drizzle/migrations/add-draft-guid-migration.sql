-- Add GUID field to drafts table for external APIs
ALTER TABLE da.drafts ADD COLUMN guid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid();

-- Create index for efficient lookups by GUID
CREATE INDEX idx_drafts_guid ON da.drafts(guid);

-- Update existing drafts to have GUIDs (if any exist)
UPDATE da.drafts SET guid = gen_random_uuid() WHERE guid IS NULL; 