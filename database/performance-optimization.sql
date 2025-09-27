-- Performance Optimization Script for Enhanced Content Features
-- This script adds database indexes, optimizes queries, and implements caching strategies
-- Run this after the enhanced-schema-migration.sql

-- ============================================================================
-- 1. ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS posts_user_status_created_idx 
  ON posts(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS posts_user_campaign_status_idx 
  ON posts(user_id, campaign_id, status) WHERE campaign_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS posts_user_series_idx 
  ON posts(user_id, series_id) WHERE series_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS posts_schedule_date_status_idx 
  ON posts(schedule_date, status) WHERE schedule_date IS NOT NULL;

-- Analytics performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS post_analytics_post_platform_recorded_idx 
  ON post_analytics(post_id, platform, recorded_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS post_analytics_platform_recorded_engagement_idx 
  ON post_analytics(platform, recorded_at DESC, engagement_rate DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS post_analytics_recorded_at_engagement_idx 
  ON post_analytics(recorded_at DESC, engagement_rate DESC);

-- Campaign and series performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS campaigns_user_status_start_date_idx 
  ON campaigns(user_id, status, start_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS content_series_user_campaign_frequency_idx 
  ON content_series(user_id, campaign_id, frequency) WHERE campaign_id IS NOT NULL;

-- Template usage indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS content_templates_category_rating_usage_idx 
  ON content_templates(category, rating DESC, usage_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS content_templates_content_type_public_rating_idx 
  ON content_templates(content_type, is_public, rating DESC);

-- Brand voice and audience profile indexes for quick lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS brand_voices_user_name_tone_idx 
  ON brand_voices(user_id, name, tone);

CREATE INDEX CONCURRENTLY IF NOT EXISTS audience_profiles_user_industry_age_idx 
  ON audience_profiles(user_id, industry, age_range);

-- ============================================================================
-- 2. MATERIALIZED VIEWS FOR ANALYTICS PERFORMANCE
-- ============================================================================

-- Daily analytics summary for faster reporting
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analytics_summary AS
SELECT 
  DATE(recorded_at) as analytics_date,
  platform,
  COUNT(*) as post_count,
  SUM(likes) as total_likes,
  SUM(shares) as total_shares,
  SUM(comments) as total_comments,
  SUM(clicks) as total_clicks,
  SUM(impressions) as total_impressions,
  SUM(reach) as total_reach,
  AVG(engagement_rate) as avg_engagement_rate,
  MAX(engagement_rate) as max_engagement_rate
FROM post_analytics
GROUP BY DATE(recorded_at), platform;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS daily_analytics_summary_date_platform_idx 
  ON daily_analytics_summary(analytics_date, platform);

-- Weekly analytics summary
CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_analytics_summary AS
SELECT 
  DATE_TRUNC('week', recorded_at) as week_start,
  platform,
  COUNT(*) as post_count,
  SUM(likes) as total_likes,
  SUM(shares) as total_shares,
  SUM(comments) as total_comments,
  SUM(clicks) as total_clicks,
  SUM(impressions) as total_impressions,
  SUM(reach) as total_reach,
  AVG(engagement_rate) as avg_engagement_rate
FROM post_analytics
GROUP BY DATE_TRUNC('week', recorded_at), platform;

CREATE UNIQUE INDEX IF NOT EXISTS weekly_analytics_summary_week_platform_idx 
  ON weekly_analytics_summary(week_start, platform);

-- User performance summary for dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS user_performance_summary AS
SELECT 
  p.user_id,
  COUNT(DISTINCT p.id) as total_posts,
  COUNT(DISTINCT pa.id) as posts_with_analytics,
  AVG(pa.engagement_rate) as avg_engagement_rate,
  SUM(pa.likes + pa.shares + pa.comments + pa.clicks) as total_engagement,
  SUM(pa.impressions) as total_impressions,
  COUNT(DISTINCT pa.platform) as platforms_used,
  MAX(pa.recorded_at) as last_analytics_update
FROM posts p
LEFT JOIN post_analytics pa ON p.id = pa.post_id
GROUP BY p.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS user_performance_summary_user_idx 
  ON user_performance_summary(user_id);

-- ============================================================================
-- 3. FUNCTIONS FOR REFRESHING MATERIALIZED VIEWS
-- ============================================================================

-- Function to refresh daily analytics
CREATE OR REPLACE FUNCTION refresh_daily_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh weekly analytics
CREATE OR REPLACE FUNCTION refresh_weekly_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh user performance summary
CREATE OR REPLACE FUNCTION refresh_user_performance_summary()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh all analytics views
CREATE OR REPLACE FUNCTION refresh_all_analytics_views()
RETURNS VOID AS $$
BEGIN
  PERFORM refresh_daily_analytics();
  PERFORM refresh_weekly_analytics();
  PERFORM refresh_user_performance_summary();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. OPTIMIZED QUERY FUNCTIONS
-- ============================================================================

-- Fast user dashboard data retrieval
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID)
RETURNS TABLE(
  total_posts BIGINT,
  posts_this_week BIGINT,
  avg_engagement_rate NUMERIC,
  top_platform TEXT,
  recent_performance JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(p.id) as total_posts,
      COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as posts_this_week
    FROM posts p
    WHERE p.user_id = p_user_id
  ),
  engagement_stats AS (
    SELECT 
      AVG(pa.engagement_rate) as avg_engagement_rate,
      pa.platform,
      SUM(pa.likes + pa.shares + pa.comments + pa.clicks) as total_engagement
    FROM posts p
    JOIN post_analytics pa ON p.id = pa.post_id
    WHERE p.user_id = p_user_id
      AND pa.recorded_at >= NOW() - INTERVAL '30 days'
    GROUP BY pa.platform
  ),
  top_platform AS (
    SELECT platform
    FROM engagement_stats
    ORDER BY total_engagement DESC
    LIMIT 1
  ),
  recent_performance AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', DATE(pa.recorded_at),
        'engagement', pa.likes + pa.shares + pa.comments + pa.clicks,
        'platform', pa.platform
      ) ORDER BY pa.recorded_at DESC
    ) as performance_data
    FROM posts p
    JOIN post_analytics pa ON p.id = pa.post_id
    WHERE p.user_id = p_user_id
      AND pa.recorded_at >= NOW() - INTERVAL '7 days'
  )
  SELECT 
    us.total_posts,
    us.posts_this_week,
    COALESCE(es.avg_engagement_rate, 0),
    COALESCE(tp.platform, 'N/A'),
    COALESCE(rp.performance_data, '[]'::jsonb)
  FROM user_stats us
  CROSS JOIN (SELECT AVG(avg_engagement_rate) as avg_engagement_rate FROM engagement_stats) es
  CROSS JOIN (SELECT platform FROM top_platform) tp
  CROSS JOIN recent_performance rp;
END;
$$ LANGUAGE plpgsql;

-- Fast campaign performance retrieval
CREATE OR REPLACE FUNCTION get_campaign_performance(p_campaign_id UUID)
RETURNS TABLE(
  campaign_name TEXT,
  total_posts BIGINT,
  avg_engagement_rate NUMERIC,
  total_reach BIGINT,
  platform_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH campaign_posts AS (
    SELECT p.id, p.topic
    FROM posts p
    WHERE p.campaign_id = p_campaign_id
  ),
  campaign_analytics AS (
    SELECT 
      pa.platform,
      COUNT(*) as post_count,
      AVG(pa.engagement_rate) as avg_engagement_rate,
      SUM(pa.reach) as total_reach,
      SUM(pa.likes + pa.shares + pa.comments + pa.clicks) as total_engagement
    FROM campaign_posts cp
    JOIN post_analytics pa ON cp.id = pa.post_id
    GROUP BY pa.platform
  ),
  platform_data AS (
    SELECT jsonb_object_agg(
      platform,
      jsonb_build_object(
        'posts', post_count,
        'engagement_rate', avg_engagement_rate,
        'reach', total_reach,
        'engagement', total_engagement
      )
    ) as breakdown
    FROM campaign_analytics
  )
  SELECT 
    c.name,
    COUNT(cp.id),
    COALESCE(AVG(ca.avg_engagement_rate), 0),
    COALESCE(SUM(ca.total_reach), 0),
    COALESCE(pd.breakdown, '{}'::jsonb)
  FROM campaigns c
  LEFT JOIN campaign_posts cp ON TRUE
  LEFT JOIN campaign_analytics ca ON TRUE
  CROSS JOIN platform_data pd
  WHERE c.id = p_campaign_id
  GROUP BY c.name, pd.breakdown;
END;
$$ LANGUAGE plpgsql;

-- Fast top content retrieval with pagination
CREATE OR REPLACE FUNCTION get_top_content_paginated(
  p_user_id UUID,
  p_timeframe TEXT DEFAULT 'month',
  p_platform TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  post_id UUID,
  topic TEXT,
  platform TEXT,
  engagement_score NUMERIC,
  engagement_rate NUMERIC,
  total_engagement BIGINT,
  recorded_at TIMESTAMPTZ
) AS $$
DECLARE
  start_date TIMESTAMPTZ;
BEGIN
  -- Calculate start date based on timeframe
  CASE p_timeframe
    WHEN 'week' THEN start_date := NOW() - INTERVAL '7 days';
    WHEN 'month' THEN start_date := NOW() - INTERVAL '30 days';
    WHEN 'quarter' THEN start_date := NOW() - INTERVAL '90 days';
    WHEN 'year' THEN start_date := NOW() - INTERVAL '365 days';
    ELSE start_date := NOW() - INTERVAL '30 days';
  END CASE;

  RETURN QUERY
  SELECT 
    p.id,
    p.topic,
    pa.platform,
    (pa.likes + pa.shares * 3 + pa.comments * 2 + pa.clicks * 1.5)::NUMERIC as engagement_score,
    pa.engagement_rate,
    (pa.likes + pa.shares + pa.comments + pa.clicks)::BIGINT as total_engagement,
    pa.recorded_at
  FROM posts p
  JOIN post_analytics pa ON p.id = pa.post_id
  WHERE p.user_id = p_user_id
    AND pa.recorded_at >= start_date
    AND (p_platform IS NULL OR pa.platform = p_platform)
  ORDER BY engagement_score DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. AUTOMATIC MAINTENANCE TASKS
-- ============================================================================

-- Function to clean up old analytics data (keep last 2 years)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM post_analytics 
  WHERE recorded_at < NOW() - INTERVAL '2 years';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Refresh materialized views after cleanup
  PERFORM refresh_all_analytics_views();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update template usage counts
CREATE OR REPLACE FUNCTION update_template_usage_counts()
RETURNS VOID AS $$
BEGIN
  UPDATE content_templates ct
  SET usage_count = (
    SELECT COUNT(*)
    FROM posts p
    WHERE p.template_id = ct.id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update performance scores
CREATE OR REPLACE FUNCTION batch_update_performance_scores()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE posts 
  SET performance_score = (
    SELECT COALESCE(AVG(
      LEAST(
        (pa.likes + pa.shares + pa.comments + pa.clicks)::DECIMAL / 
        NULLIF(pa.impressions, 0) * 100 / 10.0 * 10, 
        10.0
      )
    ), 0)
    FROM post_analytics pa
    WHERE pa.post_id = posts.id
  )
  WHERE EXISTS (
    SELECT 1 FROM post_analytics pa WHERE pa.post_id = posts.id
  );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. SCHEDULED MAINTENANCE (CRON JOBS - IF AVAILABLE)
-- ============================================================================

-- Note: These would be set up as cron jobs or scheduled tasks
-- Example cron expressions (commented out as they depend on pg_cron extension):

-- Refresh materialized views every hour
-- SELECT cron.schedule('refresh-analytics-hourly', '0 * * * *', 'SELECT refresh_all_analytics_views();');

-- Clean up old analytics data weekly
-- SELECT cron.schedule('cleanup-analytics-weekly', '0 2 * * 0', 'SELECT cleanup_old_analytics();');

-- Update template usage counts daily
-- SELECT cron.schedule('update-template-usage-daily', '0 1 * * *', 'SELECT update_template_usage_counts();');

-- Update performance scores daily
-- SELECT cron.schedule('update-performance-scores-daily', '0 3 * * *', 'SELECT batch_update_performance_scores();');

-- ============================================================================
-- 7. QUERY OPTIMIZATION HINTS
-- ============================================================================

-- Enable query plan caching for better performance
SET shared_preload_libraries = 'pg_stat_statements';

-- Increase work memory for complex analytics queries
-- SET work_mem = '256MB'; -- Adjust based on available memory

-- Enable parallel query execution for large datasets
-- SET max_parallel_workers_per_gather = 4; -- Adjust based on CPU cores

-- ============================================================================
-- 8. PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View to monitor slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_time > 100 -- Queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- View to monitor table sizes and growth
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- View to monitor index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE 
    WHEN idx_scan = 0 THEN 'Never used'
    WHEN idx_scan < 100 THEN 'Rarely used'
    ELSE 'Frequently used'
  END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION COMPLETED
-- ============================================================================

-- Initial refresh of materialized views
SELECT refresh_all_analytics_views();

-- Update performance scores for existing posts
SELECT batch_update_performance_scores();

-- Update template usage counts
SELECT update_template_usage_counts();

-- Performance optimization script completed successfully
-- Monitor query performance using the provided views and adjust as needed