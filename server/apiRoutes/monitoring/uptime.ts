import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Uptime Monitoring API
 *
 * Provides uptime monitoring and status page functionality
 */

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime?: number;
  lastChecked: number;
  uptime: number;
  incidents: number;
}

interface UptimeData {
  overall: {
    status: 'operational' | 'degraded' | 'outage';
    uptime: number;
    lastIncident?: number;
  };
  services: ServiceStatus[];
  incidents: Array<{
    id: string;
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    severity: 'minor' | 'major' | 'critical';
    startTime: number;
    endTime?: number;
    updates: Array<{
      timestamp: number;
      message: string;
      status: string;
    }>;
  }>;
  metrics: {
    averageResponseTime: number;
    uptimePercentage: number;
    totalRequests: number;
    errorRate: number;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const uptimeData = await generateUptimeData();

    res.status(200).json(uptimeData);
  } catch (error) {
    console.error('Uptime monitoring error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function generateUptimeData(): Promise<UptimeData> {
  const services = await checkAllServices();
  const overall = calculateOverallStatus(services);
  const incidents = getRecentIncidents();
  const metrics = calculateMetrics(services);

  return {
    overall,
    services,
    incidents,
    metrics,
  };
}

async function checkAllServices(): Promise<ServiceStatus[]> {
  const servicesToCheck = [
    {
      name: 'Web Application',
      url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      endpoint: '/',
    },
    {
      name: 'API Health',
      url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      endpoint: '/api/health',
    },
    {
      name: 'Database',
      url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      endpoint: '/api/health/database',
    },
    {
      name: 'AI Services',
      url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      endpoint: '/api/health',
    },
  ];

  const serviceChecks = servicesToCheck.map(async (service) => {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      let response: Response;
      try {
        response = await fetch(`${service.url}${service.endpoint}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Uptime-Monitor/1.0',
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      let status: 'operational' | 'degraded' | 'outage' = 'operational';
      if (!isHealthy) {
        status = response.status >= 500 ? 'outage' : 'degraded';
      } else if (responseTime > 5000) {
        status = 'degraded';
      }

      return {
        name: service.name,
        status,
        responseTime,
        lastChecked: Date.now(),
        uptime: calculateServiceUptime(service.name, isHealthy),
        incidents: getServiceIncidentCount(service.name),
      };
    } catch (error) {
      console.error(`Service check failed for ${service.name}:`, error);

      return {
        name: service.name,
        status: 'outage' as const,
        responseTime: undefined,
        lastChecked: Date.now(),
        uptime: calculateServiceUptime(service.name, false),
        incidents: getServiceIncidentCount(service.name) + 1,
      };
    }
  });

  return Promise.all(serviceChecks);
}

function calculateOverallStatus(services: ServiceStatus[]): UptimeData['overall'] {
  const hasOutage = services.some((s) => s.status === 'outage');
  const hasDegraded = services.some((s) => s.status === 'degraded');

  let status: 'operational' | 'degraded' | 'outage' = 'operational';
  if (hasOutage) {
    status = 'outage';
  } else if (hasDegraded) {
    status = 'degraded';
  }

  // Calculate overall uptime (simplified)
  const totalUptime = services.reduce((sum, service) => sum + service.uptime, 0);
  const averageUptime = services.length > 0 ? totalUptime / services.length : 100;

  return {
    status,
    uptime: averageUptime,
    lastIncident: getLastIncidentTime(),
  };
}

function calculateServiceUptime(_serviceName: string, isCurrentlyHealthy: boolean): number {
  // This is a simplified calculation
  // In a real implementation, you would track historical uptime data

  // For demo purposes, return a high uptime percentage with some variation
  const baseUptime = 99.5;
  const variation = Math.random() * 0.5; // 0-0.5% variation
  const currentPenalty = isCurrentlyHealthy ? 0 : 0.1;

  return Math.max(95, baseUptime + variation - currentPenalty);
}

function getServiceIncidentCount(serviceName: string): number {
  // This would be retrieved from a database in a real implementation
  // For demo purposes, return a small random number
  return Math.floor(Math.random() * 3);
}

function getRecentIncidents(): UptimeData['incidents'] {
  // This would be retrieved from a database in a real implementation
  // For demo purposes, return some sample incidents

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  return [
    {
      id: 'incident_001',
      title: 'Intermittent API Timeouts',
      status: 'resolved',
      severity: 'minor',
      startTime: now - 2 * oneDay,
      endTime: now - 2 * oneDay + 30 * 60 * 1000, // 30 minutes
      updates: [
        {
          timestamp: now - 2 * oneDay,
          message: 'We are investigating reports of intermittent API timeouts.',
          status: 'investigating',
        },
        {
          timestamp: now - 2 * oneDay + 15 * 60 * 1000,
          message: 'Issue identified with database connection pooling. Implementing fix.',
          status: 'identified',
        },
        {
          timestamp: now - 2 * oneDay + 30 * 60 * 1000,
          message: 'Fix deployed and monitoring for stability. Issue resolved.',
          status: 'resolved',
        },
      ],
    },
    {
      id: 'incident_002',
      title: 'Scheduled Maintenance',
      status: 'resolved',
      severity: 'minor',
      startTime: now - oneWeek,
      endTime: now - oneWeek + 60 * 60 * 1000, // 1 hour
      updates: [
        {
          timestamp: now - oneWeek - 24 * 60 * 60 * 1000,
          message: 'Scheduled maintenance window for database upgrades.',
          status: 'monitoring',
        },
        {
          timestamp: now - oneWeek,
          message: 'Maintenance started. Some services may be temporarily unavailable.',
          status: 'monitoring',
        },
        {
          timestamp: now - oneWeek + 60 * 60 * 1000,
          message: 'Maintenance completed successfully. All services restored.',
          status: 'resolved',
        },
      ],
    },
  ];
}

function getLastIncidentTime(): number {
  const incidents = getRecentIncidents();
  if (incidents.length === 0) return 0;

  return Math.max(...incidents.map((i) => i.startTime));
}

function calculateMetrics(services: ServiceStatus[]): UptimeData['metrics'] {
  const responseTimes = services
    .map((s) => s.responseTime)
    .filter((rt): rt is number => rt !== undefined);

  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
      : 0;

  const uptimes = services.map((s) => s.uptime);
  const uptimePercentage =
    uptimes.length > 0 ? uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length : 100;

  // Simulated metrics for demo
  const totalRequests = Math.floor(Math.random() * 10000) + 50000;
  const errorRate = Math.random() * 2; // 0-2% error rate

  return {
    averageResponseTime: Math.round(averageResponseTime),
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    totalRequests,
    errorRate: Math.round(errorRate * 100) / 100,
  };
}
