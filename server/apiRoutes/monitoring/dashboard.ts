import type { VercelRequest, VercelResponse } from '@vercel/node';
import { productionMonitoringService } from '../../../services/productionMonitoringService';

/**
 * Monitoring Dashboard API
 *
 * Provides real-time monitoring data for production dashboard
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    switch (req.method) {
      case 'GET':
        return handleGetDashboard(req, res);
      case 'POST':
        return handlePostMetric(req, res);
      case 'PUT':
        return handleUpdateAlert(req, res);
      case 'DELETE':
        return handleDeleteAlert(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleGetDashboard(req: VercelRequest, res: VercelResponse) {
  const { timeWindow } = req.query;
  const windowMs = timeWindow ? parseInt(timeWindow as string) * 1000 : 60 * 60 * 1000; // Default 1 hour

  const dashboardData = productionMonitoringService.getDashboardData();
  const metricsSummary = productionMonitoringService.getMetricsSummary(windowMs);
  const alertHistory = productionMonitoringService.getAlertHistory(20);

  // Add system statistics
  const systemStats = {
    uptime: process.uptime() * 1000,
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: Date.now(),
  };

  const response = {
    ...dashboardData,
    metricsSummary,
    alertHistory,
    systemStats,
    timeWindow: windowMs,
  };

  res.status(200).json(response);
}

async function handlePostMetric(req: VercelRequest, res: VercelResponse) {
  const { name, value, tags, unit } = req.body;

  if (!name || value === undefined) {
    return res.status(400).json({ error: 'Missing required fields: name, value' });
  }

  productionMonitoringService.recordMetric(name, value, tags, unit);

  res.status(201).json({
    success: true,
    message: 'Metric recorded successfully',
  });
}

async function handleUpdateAlert(req: VercelRequest, res: VercelResponse) {
  const { alertId, action } = req.body;

  if (!alertId || !action) {
    return res.status(400).json({ error: 'Missing required fields: alertId, action' });
  }

  if (action === 'resolve') {
    const success = productionMonitoringService.resolveAlert(alertId);
    if (success) {
      res.status(200).json({ success: true, message: 'Alert resolved' });
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } else {
    res.status(400).json({ error: 'Invalid action. Supported actions: resolve' });
  }
}

async function handleDeleteAlert(req: VercelRequest, res: VercelResponse) {
  const { ruleId } = req.query;

  if (!ruleId) {
    return res.status(400).json({ error: 'Missing required parameter: ruleId' });
  }

  const success = productionMonitoringService.deleteAlertRule(ruleId as string);

  if (success) {
    res.status(200).json({ success: true, message: 'Alert rule deleted' });
  } else {
    res.status(404).json({ error: 'Alert rule not found' });
  }
}
