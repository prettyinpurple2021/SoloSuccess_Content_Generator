-- Migration: Add scheduler columns to posts table
-- This migration adds the necessary columns and indexes for the Upstash QStash scheduler

-- Add scheduler-related columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS (
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  last_publish_attempt_at TIMESTAMPTZ,
  publish_error_message TEXT
);

-- Create index for efficient querying of scheduled posts
CREATE INDEX IF NOT EXISTS idx_posts_status_scheduled_at 
  ON posts(status, scheduled_at) 
  WHERE status = 'scheduled';

-- Create index for retry queries
CREATE INDEX IF NOT EXISTS idx_posts_next_retry_at 
  ON posts(next_retry_at)
  WHERE status = 'scheduled' AND retry_count > 0;

-- Create index for published posts (for analytics)
CREATE INDEX IF NOT EXISTS idx_posts_published_at 
  ON posts(user_id, published_at DESC)
  WHERE status = 'published';

-- Create index for user's posts (for dashboard/calendar view)
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at 
  ON posts(user_id, created_at DESC);

-- Add comment to posts table explaining scheduler columns
COMMENT ON COLUMN posts.status IS 'Post status: draft (in progress), scheduled (queued for publication), published (live on platforms), failed (publication failed)';
COMMENT ON COLUMN posts.scheduled_at IS 'Timestamp when the post should be published';
COMMENT ON COLUMN posts.published_at IS 'Timestamp when the post was successfully published';
COMMENT ON COLUMN posts.retry_count IS 'Number of publication attempts (for retry logic)';
COMMENT ON COLUMN posts.next_retry_at IS 'Timestamp for next publication attempt if previous failed';
COMMENT ON COLUMN posts.last_publish_attempt_at IS 'Timestamp of the last publication attempt';
COMMENT ON COLUMN posts.publish_error_message IS 'Error message from last failed publication attempt';
