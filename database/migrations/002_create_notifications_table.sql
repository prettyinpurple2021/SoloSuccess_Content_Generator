-- Migration: Create notifications table for user notifications
-- Stores notifications for post publishing, failures, and other events

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('post_published', 'post_failed', 'integration_error', 'other')),
  read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read 
  ON notifications(user_id, read)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'User notifications for post publishing, failures, and system events';
COMMENT ON COLUMN notifications.type IS 'Notification type: post_published, post_failed, integration_error, or other';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN notifications.metadata IS 'Additional metadata for the notification (JSON)';
