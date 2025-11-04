/**
 * Database Performance Monitoring API
 * Provides endpoints for monitoring database performance and applying optimizations
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectionManager } from '../../services/databaseConnectionManager';
import { databasePerformanceService } from '../../services/databasePerformanceService';
import { errorHandler } from '../../services/errorHandlingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';

    switch (action) {
      case 'metrics':
        return await getPerformanceMetrics();

      case 'health':
        return await getDatabaseHealth();

      case 'analysis':
        return await getPerformanceAnalysis();

      case 'recommendations':
        return await getOptimizationRecommendations();

      case 'alerts':
        return await getPerformanceAlerts();

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error) {
    errorHandler.logError(
      'Database performance API error',
      error instanceof Error ? error : new Error(String(error)),
      { operation: 'performance_api' }
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'optimize':
        return await applyOptimizations();

      case 'analyze':
        return await analyzeIndexUsage();

      case 'cleanup':
        return await cleanupOldData();

      case 'reindex':
        return await reindexTables();

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error) {
    errorHandler.logError(
      'Database performance API POST error',
      error instanceof Error ? error : new Error(String(error)),
      { operation: 'performance_api_post' }
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get current performance metrics
 */
async function getPerformanceMetrics() {
  const performanceMetrics = databasePerformanceService.getPerformanceMetrics();
  const connectionMetrics = connectionManager.getDetailedMetrics();
  const poolStatus = connectionManager.getStatus();

  return NextResponse.json({
    success: true,
    data: {
      performance: performanceMetrics,
      connection: connectionMetrics,
      pool: poolStatus,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Get database health status
 */
async function getDatabaseHealth() {
  const healthCheck = await connectionManager.testConnection();
  const poolStatus = connectionManager.getStatus();

  return NextResponse.json({
    success: true,
    data: {
      health: healthCheck,
      pool: poolStatus,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Get performance analysis and index usage
 */
async function getPerformanceAnalysis() {
  const pool = connectionManager.getPool();
  const analysis = await databasePerformanceService.analyzeIndexUsage(pool);

  return NextResponse.json({
    success: true,
    data: {
      analysis,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Get optimization recommendations
 */
async function getOptimizationRecommendations() {
  // Get performance recommendations from database
  const recommendations = await connectionManager.executeOptimizedQuery(
    'SELECT * FROM get_performance_recommendations()',
    [],
    'get_recommendations'
  );

  // Get performance health check
  const healthCheck = await connectionManager.executeOptimizedQuery(
    'SELECT * FROM performance_health_check()',
    [],
    'health_check'
  );

  return NextResponse.json({
    success: true,
    data: {
      recommendations,
      healthCheck,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Get performance alerts
 */
async function getPerformanceAlerts() {
  const alerts = databasePerformanceService.getPerformanceAlerts();

  return NextResponse.json({
    success: true,
    data: {
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Apply database optimizations
 */
async function applyOptimizations() {
  const pool = connectionManager.getPool();
  const result = await databasePerformanceService.applyOptimizations(pool);

  return NextResponse.json({
    success: true,
    data: {
      applied: result.applied,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Analyze index usage
 */
async function analyzeIndexUsage() {
  const pool = connectionManager.getPool();
  const analysis = await databasePerformanceService.analyzeIndexUsage(pool);

  return NextResponse.json({
    success: true,
    data: {
      analysis,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Clean up old data
 */
async function cleanupOldData() {
  const result = (await connectionManager.executeOptimizedQuery(
    'SELECT cleanup_old_analytics_data($1)',
    [90], // Keep 90 days of data
    'cleanup_old_data'
  )) as Array<{ cleanup_old_analytics_data?: string }>;

  return NextResponse.json({
    success: true,
    data: {
      result: result[0]?.cleanup_old_analytics_data || 'Cleanup completed',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Reindex performance critical tables
 */
async function reindexTables() {
  const result = (await connectionManager.executeOptimizedQuery(
    'SELECT reindex_performance_critical_tables()',
    [],
    'reindex_tables'
  )) as Array<{ reindex_performance_critical_tables?: string }>;

  return NextResponse.json({
    success: true,
    data: {
      result: result[0]?.reindex_performance_critical_tables || 'Reindex completed',
      timestamp: new Date().toISOString(),
    },
  });
}
