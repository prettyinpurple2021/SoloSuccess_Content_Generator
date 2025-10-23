// Database Setup Fix Script
// This script will help you apply the correct database schema

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Database schema that should be applied
const databaseSchema = `
-- Complete Database Schema for Soloboss AI Content Planner
-- This ensures all tables exist with proper RLS policies

-- 1. Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  idea TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'posted')) DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',
  summary TEXT,
  headlines TEXT[] DEFAULT '{}',
  social_media_posts JSONB DEFAULT '{}',
  social_media_tones JSONB DEFAULT '{}',
  social_media_audiences JSONB DEFAULT '{}',
  selected_image TEXT,
  schedule_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  posted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  brand_voice_id UUID,
  audience_profile_id UUID,
  campaign_id UUID,
  series_id UUID,
  template_id UUID,
  performance_score INTEGER DEFAULT 0,
  optimization_suggestions JSONB DEFAULT '{}',
  image_style_id UUID
);

-- 2. Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
DROP POLICY IF EXISTS "Users can access own posts" ON posts;
CREATE POLICY "Users can access own posts" ON posts
  FOR ALL USING (auth.uid() = user_id);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_schedule_date_idx ON posts(schedule_date);

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- 8. Create brand_voices table
CREATE TABLE IF NOT EXISTS brand_voices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tone TEXT NOT NULL,
  vocabulary TEXT[] DEFAULT '{}',
  writing_style TEXT,
  target_audience TEXT,
  sample_content TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own brand voices" ON brand_voices;
CREATE POLICY "Users can access own brand voices" ON brand_voices
  FOR ALL USING (auth.uid() = user_id);

-- 9. Create audience_profiles table
CREATE TABLE IF NOT EXISTS audience_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_range TEXT,
  industry TEXT,
  interests TEXT[] DEFAULT '{}',
  pain_points TEXT[] DEFAULT '{}',
  preferred_content_types TEXT[] DEFAULT '{}',
  engagement_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audience_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own audience profiles" ON audience_profiles;
CREATE POLICY "Users can access own audience profiles" ON audience_profiles
  FOR ALL USING (auth.uid() = user_id);

-- 10. Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  platforms TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
  performance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own campaigns" ON campaigns;
CREATE POLICY "Users can access own campaigns" ON campaigns
  FOR ALL USING (auth.uid() = user_id);

-- 11. Create content_series table
CREATE TABLE IF NOT EXISTS content_series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT,
  total_posts INTEGER DEFAULT 0,
  frequency TEXT,
  current_post INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_series ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own content series" ON content_series;
CREATE POLICY "Users can access own content series" ON content_series
  FOR ALL USING (auth.uid() = user_id);

-- 12. Create content_templates table
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  industry TEXT,
  content_type TEXT,
  structure JSONB DEFAULT '{}',
  customizable_fields JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own content templates" ON content_templates;
CREATE POLICY "Users can access own content templates" ON content_templates
  FOR ALL USING (auth.uid() = user_id);

-- 13. Create image_styles table
CREATE TABLE IF NOT EXISTS image_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  style_prompt TEXT NOT NULL,
  color_palette TEXT[] DEFAULT '{}',
  visual_elements TEXT[] DEFAULT '{}',
  brand_assets JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE image_styles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own image styles" ON image_styles;
CREATE POLICY "Users can access own image styles" ON image_styles
  FOR ALL USING (auth.uid() = user_id);

-- 14. Create post_analytics table
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own post analytics" ON post_analytics;
CREATE POLICY "Users can access own post analytics" ON post_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_analytics.post_id 
      AND posts.user_id = auth.uid()
    )
  );

-- 15. Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('social_media', 'analytics', 'crm', 'email', 'storage', 'ai_service')),
  platform TEXT NOT NULL,
  status JSONB DEFAULT '{"connected": false, "syncInProgress": false, "errorCount": 0, "healthScore": 0}',
  credentials JSONB NOT NULL,
  configuration JSONB DEFAULT '{}',
  last_sync TIMESTAMPTZ,
  sync_frequency INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own integrations" ON integrations;
CREATE POLICY "Users can access own integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);

-- 16. Create integration_logs table
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own integration logs" ON integration_logs;
CREATE POLICY "Users can access own integration logs" ON integration_logs
  FOR ALL USING (auth.uid() = user_id);

-- 17. Create integration_alerts table
CREATE TABLE IF NOT EXISTS integration_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE integration_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own integration alerts" ON integration_alerts;
CREATE POLICY "Users can access own integration alerts" ON integration_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_alerts.integration_id 
      AND integrations.user_id = auth.uid()
    )
  );

-- 18. Create integration_metrics table
CREATE TABLE IF NOT EXISTS integration_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  average_response_time DECIMAL(10,2) DEFAULT 0.00,
  last_request_time TIMESTAMPTZ,
  error_rate DECIMAL(5,2) DEFAULT 0.00,
  uptime DECIMAL(5,2) DEFAULT 100.00,
  data_processed BIGINT DEFAULT 0,
  sync_count INTEGER DEFAULT 0,
  last_sync_duration INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE integration_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own integration metrics" ON integration_metrics;
CREATE POLICY "Users can access own integration metrics" ON integration_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_metrics.integration_id 
      AND integrations.user_id = auth.uid()
    )
  );

-- 19. Create integration_webhooks table
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  retry_policy JSONB DEFAULT '{"maxRetries": 3, "backoffMultiplier": 2, "initialDelay": 1000, "maxDelay": 30000}',
  headers JSONB DEFAULT '{}',
  timeout INTEGER DEFAULT 30000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own webhooks" ON integration_webhooks;
CREATE POLICY "Users can access own webhooks" ON integration_webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_webhooks.integration_id 
      AND integrations.user_id = auth.uid()
    )
  );

-- 20. Create additional indexes for performance
CREATE INDEX IF NOT EXISTS brand_voices_user_id_idx ON brand_voices(user_id);
CREATE INDEX IF NOT EXISTS audience_profiles_user_id_idx ON audience_profiles(user_id);
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS content_series_user_id_idx ON content_series(user_id);
CREATE INDEX IF NOT EXISTS content_templates_user_id_idx ON content_templates(user_id);
CREATE INDEX IF NOT EXISTS image_styles_user_id_idx ON image_styles(user_id);
CREATE INDEX IF NOT EXISTS post_analytics_post_id_idx ON post_analytics(post_id);
CREATE INDEX IF NOT EXISTS integrations_user_id_idx ON integrations(user_id);
CREATE INDEX IF NOT EXISTS integration_logs_integration_id_idx ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS integration_alerts_integration_id_idx ON integration_alerts(integration_id);
CREATE INDEX IF NOT EXISTS integration_metrics_integration_id_idx ON integration_metrics(integration_id);
CREATE INDEX IF NOT EXISTS integration_webhooks_integration_id_idx ON integration_webhooks(integration_id);

-- 21. Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE brand_voices;
ALTER PUBLICATION supabase_realtime ADD TABLE audience_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE content_series;
ALTER PUBLICATION supabase_realtime ADD TABLE content_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE image_styles;
ALTER PUBLICATION supabase_realtime ADD TABLE post_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE integrations;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE integration_webhooks;
`;

async function applyDatabaseSchema() {
  console.log('🔄 Applying database schema...');
  
  try {
    // Split the schema into individual statements
    const statements = databaseSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} error:`, err.message);
        }
      }
    }
    
    console.log('✅ Database schema application completed');
    
    // Test the connection
    const { data, error } = await supabase.from('posts').select('count');
    if (error) {
      console.error('❌ Database connection test failed:', error);
    } else {
      console.log('✅ Database connection test passed');
    }
    
  } catch (err) {
    console.error('❌ Schema application failed:', err);
  }
}

// Run the schema application
applyDatabaseSchema();
