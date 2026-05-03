-- Add artifacts and citations columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS artifacts JSONB,
ADD COLUMN IF NOT EXISTS citations JSONB;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_artifacts ON messages USING gin(artifacts);
CREATE INDEX IF NOT EXISTS idx_messages_citations ON messages USING gin(citations);

-- Add comment for documentation
COMMENT ON COLUMN messages.artifacts IS 'Stores tables and charts artifacts as JSON';
COMMENT ON COLUMN messages.citations IS 'Stores citation references as JSON array';
