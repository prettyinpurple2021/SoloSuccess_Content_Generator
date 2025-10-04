import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Integration, IntegrationMetrics, IntegrationLog, IntegrationAlert } from '../../types';
import { integrationService } from '../../services/integrationService';
import RealTimeMonitoringDashboard from './RealTimeMonitoringDashboard';

interface MonitorIntegrationsProps {
  integrations: Integration[];
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const MonitorIntegrations: React.FC<MonitorIntegrationsProps> = ({
  integrations,
  onRefresh,
  isLoading
}) => {
  const [metrics, setMetrics] = useState<IntegrationMetrics[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [alerts, setAlerts] = useState<IntegrationAlert[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load monitoring data
  useEffect(() => {
    loadMonitoringData();
  }, [selectedIntegration, timeRange]);

  const loadMonitoringData = async () => {
    setIsLoadingData(true);
    try {
      // Load metrics for all integrations or selected one
      const integrationIds = selectedIntegration === 'all' 
        ? integrations.map(i => i.id)
        : [selectedIntegration];

      const metricsPromises = integrationIds.map(id => 
        integrationService.getIntegrationMetrics(id, timeRange)
      );
      
      const metricsResults = await Promise.allSettled(metricsPromises);
      const allMetrics = metricsResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<IntegrationMetrics[]>).value);
      
      setMetrics(allMetrics);

      // Mock logs and alerts - in production, these would come from the service
      setLogs(generateMockLogs(integrationIds));
      setAlerts(generateMockAlerts(integrationIds));
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Generate mock logs for demonstration
  const generateMockLogs = (integrationIds: string[]): IntegrationLog[] => {
    const levels = ['info', 'warn', 'error', 'debug'] as const;
    const messages = [
      'Integration sync completed successfully',
      'Rate limit exceeded, retrying in 60 seconds',
      'Authentication failed, invalid credentials',
      'Webhook delivery failed, retrying...',
      'Data sync started',
      'Connection timeout, retrying...',
      'API response received',
      'Error processing webhook payload'
    ];

    return integrationIds.flatMap(id => 
      Array.from({ length: 10 }, (_, i) => ({
        id: `${id}-log-${i}`,
        integrationId: id,
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        metadata: { requestId: `req-${Math.random().toString(36).substr(2, 9)}` },
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        userId: 'current-user'
      }))
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Generate mock alerts for demonstration
  const generateMockAlerts = (integrationIds: string[]): IntegrationAlert[] => {
    const types = ['error', 'warning', 'info', 'success'] as const;
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    const titles = [
      'Integration Connection Lost',
      'High Error Rate Detected',
      'Sync Performance Degraded',
      'Webhook Delivery Failed',
      'Rate Limit Approaching',
      'Authentication Expired'
    ];

    return integrationIds.flatMap(id => 
      Array.from({ length: 5 }, (_, i) => ({
        id: `${id}-alert-${i}`,
        integrationId: id,
        type: types[Math.floor(Math.random() * types.length)],
        title: titles[Math.floor(Math.random() * titles.length)],
        message: 'This is a sample alert message for monitoring purposes.',
        severity: severities[Math.floor(Math.random() * severities.length)],
        isResolved: Math.random() > 0.3,
        resolvedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000) : undefined,
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        metadata: { source: 'monitoring-system' }
      }))
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  // Calculate summary statistics
  const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
  const successfulRequests = metrics.reduce((sum, m) => sum + m.successfulRequests, 0);
  const failedRequests = metrics.reduce((sum, m) => sum + m.failedRequests, 0);
  const avgResponseTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length 
    : 0;
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'syncing': return 'text-blue-600';
      case 'maintenance': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get log level color
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Use the new Real-time Monitoring Dashboard */}
      <RealTimeMonitoringDashboard
        integrations={integrations}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />

    </div>
  );
};

export default MonitorIntegrations;