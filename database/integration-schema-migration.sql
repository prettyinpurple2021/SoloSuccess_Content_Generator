-- Integration Manager Database Schema Migration
-- This script adds comprehensive integration management tables to the existing schema
-- Run this in your Supabase SQL Editor after the base schema

-- ============================================================================
-- 1. INTEGRATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('social_media', 'analytics', 'crm', 'email', 'storage', 'ai_service')),
  platform TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected', 'error', 'syncing', 'maintenance')) DEFAULT 'disconnected',
  credentials JSONB NOT NULL, -- Encrypted credentials
  configuration JSONB DEFAULT '{
    "syncSettings": {
      "autoSync": true,
      "syncInterval": 60,
      "batchSize": 100,
      "retryAttempts": 3,
      "timeoutMs": 30000,
      "syncOnStartup": true,
      "syncOnSchedule": true
    },
    "rateLimits": {
      "requestsPerMinute": 100,
      "requestsPerHour": 1000,
      "requestsPerDay": 10000,
      "burstLimit": 20
    },
    "errorHandling": {
      "maxRetries": 3,
      "retryDelay": 1000,
      "exponentialBackoff": true,
      "deadLetterQueue": true,
      "alertOnFailure": true
    },
    "notifications": {
      "emailNotifications": true,
      "webhookNotifications": false,
      "slackNotifications": false,
      "notificationLevels": ["error", "warn"]
    }
  }',
  last_sync TIMESTAMPTZ,
  sync_frequency TEXT CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')) DEFAULT 'hourly',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for integrations
CREATE POLICY "Users can access own integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for integrations
CREATE INDEX IF NOT EXISTS integrations_user_id_idx ON integrations(user_id);
CREATE INDEX IF NOT EXISTS integrations_platform_idx ON integrations(platform);
CREATE INDEX IF NOT EXISTS integrations_type_idx ON integrations(type);
CREATE INDEX IF NOT EXISTS integrations_status_idx ON integrations(status);
CREATE INDEX IF NOT EXISTS integrations_is_active_idx ON integrations(is_active);
CREATE INDEX IF NOT EXISTS integrations_last_sync_idx ON integrations(last_sync DESC);
CREATE INDEX IF NOT EXISTS integrations_created_at_idx ON integrations(created_at DESC);

-- ============================================================================
-- 2. INTEGRATION WEBHOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  retry_policy JSONB DEFAULT '{
    "maxRetries": 3,
    "backoffMultiplier": 2,
    "initialDelay": 1000,
    "maxDelay": 30000
  }',
  headers JSONB DEFAULT '{}',
  timeout INTEGER DEFAULT 30000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for integration_webhooks
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_webhooks
CREATE POLICY "Users can access own webhooks" ON integration_webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE id = integration_webhooks.integration_id 
      AND user_id = auth.uid()
    )
  );

-- Indexes for integration_webhooks
CREATE INDEX IF NOT EXISTS integration_webhooks_integration_id_idx ON integration_webhooks(integration_id);
CREATE INDEX IF NOT EXISTS integration_webhooks_is_active_idx ON integration_webhooks(is_active);
CREATE INDEX IF NOT EXISTS integration_webhooks_created_at_idx ON integration_webhooks(created_at DESC);

-- ============================================================================
-- 3. INTEGRATION LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  level TEXT CHECK (level IN ('info', 'warn', 'error', 'debug')) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS for integration_logs
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_logs
CREATE POLICY "Users can access own integration logs" ON integration_logs
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for integration_logs
CREATE INDEX IF NOT EXISTS integration_logs_integration_id_idx ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS integration_logs_level_idx ON integration_logs(level);
CREATE INDEX IF NOT EXISTS integration_logs_timestamp_idx ON integration_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS integration_logs_user_id_idx ON integration_logs(user_id);

-- ============================================================================
-- 4. INTEGRATION ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('error', 'warning', 'info', 'success')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS for integration_alerts
ALTER TABLE integration_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_alerts
CREATE POLICY "Users can access own integration alerts" ON integration_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE id = integration_alerts.integration_id 
      AND user_id = auth.uid()
    )
  );

-- Indexes for integration_alerts
CREATE INDEX IF NOT EXISTS integration_alerts_integration_id_idx ON integration_alerts(integration_id);
CREATE INDEX IF NOT EXISTS integration_alerts_type_idx ON integration_alerts(type);
CREATE INDEX IF NOT EXISTS integration_alerts_severity_idx ON integration_alerts(severity);
CREATE INDEX IF NOT EXISTS integration_alerts_is_resolved_idx ON integration_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS integration_alerts_created_at_idx ON integration_alerts(created_at DESC);

-- ============================================================================
-- 5. WEBHOOK DELIVERIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES integration_webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'delivering', 'delivered', 'failed')) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  response_status INTEGER,
  response_headers JSONB DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for webhook_deliveries
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_deliveries
CREATE POLICY "Users can access own webhook deliveries" ON webhook_deliveries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integration_webhooks iw
      JOIN integrations i ON i.id = iw.integration_id
      WHERE iw.id = webhook_deliveries.webhook_id 
      AND i.user_id = auth.uid()
    )
  );

-- Indexes for webhook_deliveries
CREATE INDEX IF NOT EXISTS webhook_deliveries_webhook_id_idx ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS webhook_deliveries_status_idx ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS webhook_deliveries_next_retry_at_idx ON webhook_deliveries(next_retry_at);
CREATE INDEX IF NOT EXISTS webhook_deliveries_created_at_idx ON webhook_deliveries(created_at DESC);

-- ============================================================================
-- 6. INTEGRATION METRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  average_response_time DECIMAL(10,2) DEFAULT 0,
  last_request_time TIMESTAMPTZ,
  error_rate DECIMAL(5,4) DEFAULT 0,
  uptime DECIMAL(5,2) DEFAULT 100.00,
  data_processed BIGINT DEFAULT 0,
  sync_count INTEGER DEFAULT 0,
  last_sync_duration INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for integration_metrics
ALTER TABLE integration_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_metrics
CREATE POLICY "Users can access own integration metrics" ON integration_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE id = integration_metrics.integration_id 
      AND user_id = auth.uid()
    )
  );

-- Indexes for integration_metrics
CREATE INDEX IF NOT EXISTS integration_metrics_integration_id_idx ON integration_metrics(integration_id);
CREATE INDEX IF NOT EXISTS integration_metrics_recorded_at_idx ON integration_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS integration_metrics_error_rate_idx ON integration_metrics(error_rate DESC);

-- ============================================================================
-- 7. CREATE UPDATED_AT TRIGGERS FOR ALL NEW TABLES
-- ============================================================================
-- Integrations trigger
CREATE TRIGGER update_integrations_updated_at 
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Integration webhooks trigger
CREATE TRIGGER update_integration_webhooks_updated_at 
  BEFORE UPDATE ON integration_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Webhook deliveries trigger
CREATE TRIGGER update_webhook_deliveries_updated_at 
  BEFORE UPDATE ON webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. ENABLE REALTIME FOR NEW TABLES
-- ============================================================================
-- Enable realtime subscriptions for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE integrations;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_webhooks;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE webhook_deliveries;

-- ============================================================================
-- 9. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate integration health score
CREATE OR REPLACE FUNCTION calculate_integration_health_score(p_integration_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  health_score DECIMAL(5,2) := 100.00;
  error_count INTEGER;
  recent_errors INTEGER;
  avg_response_time DECIMAL(10,2);
  error_rate DECIMAL(5,4);
BEGIN
  -- Get recent error count (last 24 hours)
  SELECT COUNT(*) INTO recent_errors
  FROM integration_logs 
  WHERE integration_id = p_integration_id 
    AND level = 'error' 
    AND timestamp > NOW() - INTERVAL '24 hours';
  
  -- Get average response time (last 24 hours)
  SELECT COALESCE(AVG(average_response_time), 0) INTO avg_response_time
  FROM integration_metrics 
  WHERE integration_id = p_integration_id 
    AND recorded_at > NOW() - INTERVAL '24 hours';
  
  -- Get error rate (last 24 hours)
  SELECT COALESCE(AVG(error_rate), 0) INTO error_rate
  FROM integration_metrics 
  WHERE integration_id = p_integration_id 
    AND recorded_at > NOW() - INTERVAL '24 hours';
  
  -- Calculate health score based on various factors
  -- Deduct points for errors (5 points per error, max 50 points)
  health_score := health_score - LEAST(recent_errors * 5, 50);
  
  -- Deduct points for high response time (1 point per 100ms over 1000ms, max 20 points)
  IF avg_response_time > 1000 THEN
    health_score := health_score - LEAST((avg_response_time - 1000) / 100, 20);
  END IF;
  
  -- Deduct points for high error rate (10 points per 1% error rate, max 30 points)
  health_score := health_score - LEAST(error_rate * 1000, 30);
  
  -- Ensure health score is between 0 and 100
  health_score := GREATEST(LEAST(health_score, 100.00), 0.00);
  
  RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update integration status based on recent activity
CREATE OR REPLACE FUNCTION update_integration_status(p_integration_id UUID)
RETURNS VOID AS $$
DECLARE
  last_sync_time TIMESTAMPTZ;
  recent_errors INTEGER;
  health_score DECIMAL(5,2);
  new_status TEXT;
BEGIN
  -- Get last sync time
  SELECT last_sync INTO last_sync_time
  FROM integrations 
  WHERE id = p_integration_id;
  
  -- Get recent errors (last hour)
  SELECT COUNT(*) INTO recent_errors
  FROM integration_logs 
  WHERE integration_id = p_integration_id 
    AND level = 'error' 
    AND timestamp > NOW() - INTERVAL '1 hour';
  
  -- Calculate health score
  health_score := calculate_integration_health_score(p_integration_id);
  
  -- Determine new status based on conditions
  IF recent_errors > 5 THEN
    new_status := 'error';
  ELSIF health_score < 50 THEN
    new_status := 'error';
  ELSIF last_sync_time IS NULL OR last_sync_time < NOW() - INTERVAL '2 hours' THEN
    new_status := 'disconnected';
  ELSE
    new_status := 'connected';
  END IF;
  
  -- Update integration status
  UPDATE integrations 
  SET status = new_status, updated_at = NOW()
  WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log integration activity
CREATE OR REPLACE FUNCTION log_integration_activity(
  p_integration_id UUID,
  p_level TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  p_user_id UUID;
BEGIN
  -- Get user_id from integration
  SELECT user_id INTO p_user_id
  FROM integrations 
  WHERE id = p_integration_id;
  
  -- Insert log entry
  INSERT INTO integration_logs (
    integration_id,
    level,
    message,
    metadata,
    user_id
  ) VALUES (
    p_integration_id,
    p_level,
    p_message,
    p_metadata,
    p_user_id
  );
  
  -- Update integration status if error
  IF p_level = 'error' THEN
    PERFORM update_integration_status(p_integration_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create integration alert
CREATE OR REPLACE FUNCTION create_integration_alert(
  p_integration_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO integration_alerts (
    integration_id,
    type,
    title,
    message,
    severity,
    metadata
  ) VALUES (
    p_integration_id,
    p_type,
    p_title,
    p_message,
    p_severity,
    p_metadata
  ) RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update integration status when logs are inserted
CREATE OR REPLACE FUNCTION trigger_update_integration_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update integration status based on new log entry
  PERFORM update_integration_status(NEW.integration_id);
  
  -- Create alert for error logs
  IF NEW.level = 'error' THEN
    PERFORM create_integration_alert(
      NEW.integration_id,
      'error',
      'Integration Error',
      NEW.message,
      'high',
      NEW.metadata
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integration_logs_status_trigger
  AFTER INSERT ON integration_logs
  FOR EACH ROW EXECUTE FUNCTION trigger_update_integration_status();

-- Trigger to update metrics when integration is updated
CREATE OR REPLACE FUNCTION trigger_update_integration_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update metrics table with latest integration data
  INSERT INTO integration_metrics (
    integration_id,
    recorded_at
  ) VALUES (
    NEW.id,
    NOW()
  ) ON CONFLICT (integration_id) DO UPDATE SET
    recorded_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integration_metrics_trigger
  AFTER UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION trigger_update_integration_metrics();

-- ============================================================================
-- 11. SAMPLE DATA INSERTION (OPTIONAL - FOR DEVELOPMENT)
-- ============================================================================

-- Insert sample integration configurations (only if no data exists)
INSERT INTO integrations (user_id, name, type, platform, status, credentials, configuration)
SELECT 
  auth.uid(),
  'Twitter Integration',
  'social_media',
  'twitter',
  'disconnected',
  '{"encrypted": "sample", "iv": "sample", "authTag": "sample", "algorithm": "AES-256-GCM"}',
  '{
    "syncSettings": {
      "autoSync": true,
      "syncInterval": 30,
      "batchSize": 50,
      "retryAttempts": 3,
      "timeoutMs": 30000
    },
    "rateLimits": {
      "requestsPerMinute": 300,
      "requestsPerHour": 3000,
      "requestsPerDay": 30000,
      "burstLimit": 15
    }
  }'
WHERE NOT EXISTS (SELECT 1 FROM integrations WHERE user_id = auth.uid())
AND auth.uid() IS NOT NULL;

INSERT INTO integrations (user_id, name, type, platform, status, credentials, configuration)
SELECT 
  auth.uid(),
  'LinkedIn Integration',
  'social_media',
  'linkedin',
  'disconnected',
  '{"encrypted": "sample", "iv": "sample", "authTag": "sample", "algorithm": "AES-256-GCM"}',
  '{
    "syncSettings": {
      "autoSync": true,
      "syncInterval": 60,
      "batchSize": 25,
      "retryAttempts": 3,
      "timeoutMs": 45000
    },
    "rateLimits": {
      "requestsPerMinute": 100,
      "requestsPerHour": 1000,
      "requestsPerDay": 10000,
      "burstLimit": 10
    }
  }'
WHERE NOT EXISTS (SELECT 1 FROM integrations WHERE user_id = auth.uid() AND platform = 'linkedin')
AND auth.uid() IS NOT NULL;

-- Migration completed successfully
-- All tables created with proper RLS policies, indexes, triggers, and helper functions
