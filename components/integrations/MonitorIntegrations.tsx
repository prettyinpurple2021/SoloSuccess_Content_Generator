import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Integration, IntegrationMetrics, IntegrationAlert, IntegrationLog } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'alerts' | 'logs'>('overview');
  const [metrics, setMetrics] = useState<IntegrationMetrics[]>([]);
  const [alerts, setAlerts] = useState<IntegrationAlert[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);

  useEffect(() => {
    // In a real implementation, this would fetch data from the API
    loadMetrics();
    loadAlerts();
    loadLogs();
  }, [integrations]);

  const loadMetrics = async () => {
    // Mock data - in production, this would fetch from the API
    const mockMetrics: IntegrationMetrics[] = integrations.map(integration => ({
      integrationId: integration.id,
      totalRequests: Math.floor(Math.random() * 1000) + 100,
      successfulRequests: Math.floor(Math.random() * 800) + 80,
      failedRequests: Math.floor(Math.random() * 50) + 5,
      averageResponseTime: Math.floor(Math.random() * 500) + 100,
      avgResponseTime: Math.floor(Math.random() * 500) + 100,
      successRate: Math.floor(Math.random() * 20) + 80,
      errorRate: Math.floor(Math.random() * 10) + 1,
      uptime: Math.floor(Math.random() * 20) + 80,
      dataProcessed: Math.floor(Math.random() * 10000) + 1000,
      syncCount: Math.floor(Math.random() * 100) + 10,
      lastRequestTime: new Date(Date.now() - Math.random() * 3600000),
      lastSyncDuration: Math.floor(Math.random() * 5000) + 1000
    }));
    setMetrics(mockMetrics);
  };

  const loadAlerts = async () => {
    // Mock data - in production, this would fetch from the API
    const mockAlerts: IntegrationAlert[] = [
      {
        id: '1',
        integrationId: integrations[0]?.id || '',
        type: 'error',
        title: 'Connection Failed',
        message: 'Unable to connect to Twitter API',
        severity: 'high',
        isResolved: false,
        createdAt: new Date(Date.now() - 3600000),
        metadata: { errorCode: '401', platform: 'twitter' }
      },
      {
        id: '2',
        integrationId: integrations[1]?.id || '',
        type: 'warning',
        title: 'High Error Rate',
        message: 'Error rate has exceeded 10% in the last hour',
        severity: 'medium',
        isResolved: false,
        createdAt: new Date(Date.now() - 1800000),
        metadata: { errorRate: 12.5, threshold: 10 }
      }
    ];
    setAlerts(mockAlerts);
  };

  const loadLogs = async () => {
    // Mock data - in production, this would fetch from the API
    const mockLogs: IntegrationLog[] = [
      {
        id: '1',
        integrationId: integrations[0]?.id || '',
        level: 'info',
        message: 'Sync completed successfully',
        metadata: { recordsProcessed: 150, duration: 2500 },
        timestamp: new Date(Date.now() - 300000),
        userId: 'user-1'
      },
      {
        id: '2',
        integrationId: integrations[0]?.id || '',
        level: 'error',
        message: 'API rate limit exceeded',
        metadata: { retryAfter: 900, endpoint: '/tweets' },
        timestamp: new Date(Date.now() - 600000),
        userId: 'user-1'
      },
      {
        id: '3',
        integrationId: integrations[1]?.id || '',
        level: 'warn',
        message: 'Slow response time detected',
        metadata: { responseTime: 5000, threshold: 3000 },
        timestamp: new Date(Date.now() - 900000),
        userId: 'user-1'
      }
    ];
    setLogs(mockLogs);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-400/20 border-red-400/50';
      case 'warn':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case 'info':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/50';
      case 'debug':
        return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-400/20 border-red-400/50';
      case 'high':
        return 'text-orange-400 bg-orange-400/20 border-orange-400/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case 'low':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/50';
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      twitter: '🐦',
      linkedin: '💼',
      facebook: '📘',
      instagram: '📷',
      tiktok: '🎵',
      google_analytics: '📊',
      facebook_analytics: '📈',
      twitter_analytics: '📊',
      openai: '🤖',
      claude: '🧠'
    };
    return icons[platform] || '🔗';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Integration Monitoring</h2>
          <p className="text-white/70">Monitor the health and performance of your integrations</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-blue-500/20 text-blue-300 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/20">
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'metrics', label: 'Metrics', icon: '📈' },
          { key: 'alerts', label: 'Alerts', icon: '🚨' },
          { key: 'logs', label: 'Logs', icon: '📝' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === tab.key
                ? 'border-purple-400 text-white bg-white/10'
                : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📊</span>
                  <div>
                    <p className="text-2xl font-bold text-white">{integrations.length}</p>
                    <p className="text-sm text-white/70">Total Integrations</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">✅</span>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {integrations.filter(i => i.status === 'connected').length}
                    </p>
                    <p className="text-sm text-white/70">Connected</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">❌</span>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {integrations.filter(i => i.status === 'error').length}
                    </p>
                    <p className="text-sm text-white/70">Errors</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">🚨</span>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {alerts.filter(a => !a.isResolved).length}
                    </p>
                    <p className="text-sm text-white/70">Active Alerts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Integration Status</h3>
              <div className="space-y-3">
                {integrations.map(integration => (
                  <div key={integration.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getPlatformIcon(integration.platform)}</span>
                      <div>
                        <p className="font-medium text-white">{integration.name}</p>
                        <p className="text-sm text-white/70 capitalize">{integration.platform}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-white/70">Health Score</p>
                        <p className="font-bold text-white">{integration.status?.healthScore || 0}%</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        integration.status === 'connected' 
                          ? 'text-green-400 bg-green-400/20 border-green-400/50'
                          : integration.status === 'error'
                          ? 'text-red-400 bg-red-400/20 border-red-400/50'
                          : 'text-gray-400 bg-gray-400/20 border-gray-400/50'
                      }`}>
                        {integration.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'metrics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {metrics.map(metric => {
                const integration = integrations.find(i => i.id === metric.integrationId);
                return (
                  <div key={metric.integrationId} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-2xl">{getPlatformIcon(integration?.platform || '')}</span>
                      <div>
                        <h3 className="font-semibold text-white">{integration?.name}</h3>
                        <p className="text-sm text-white/70 capitalize">{integration?.platform}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-white/70">Success Rate</p>
                        <p className="text-2xl font-bold text-green-400">{metric.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Avg Response Time</p>
                        <p className="text-2xl font-bold text-blue-400">{metric.averageResponseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Total Requests</p>
                        <p className="text-2xl font-bold text-white">{metric.totalRequests}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Data Processed</p>
                        <p className="text-2xl font-bold text-purple-400">{metric.dataProcessed.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'alerts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              {alerts.map(alert => {
                const integration = integrations.find(i => i.id === alert.integrationId);
                return (
                  <div key={alert.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getPlatformIcon(integration?.platform || '')}</span>
                        <div>
                          <h3 className="font-semibold text-white">{alert.title}</h3>
                          <p className="text-sm text-white/70 mb-2">{alert.message}</p>
                          <p className="text-xs text-white/50">
                            {integration?.name} • {alert.createdAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Logs</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map(log => {
                  const integration = integrations.find(i => i.id === log.integrationId);
                  return (
                    <div key={log.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80">{log.message}</p>
                        <p className="text-xs text-white/50 mt-1">
                          {integration?.name} • {log.timestamp.toLocaleString()}
                        </p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-white/60 cursor-pointer">Details</summary>
                            <pre className="text-xs text-white/60 mt-1 bg-black/20 p-2 rounded">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MonitorIntegrations;
