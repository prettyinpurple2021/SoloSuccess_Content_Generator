import React from 'react';
import { motion } from 'framer-motion';
import { Integration, ConnectionTestResult, SyncResult, HealthCheckResult } from '../../types';

interface IntegrationOverviewProps {
  integrations: Integration[];
  onTestConnection: (id: string) => Promise<ConnectionTestResult>;
  onSync: (id: string) => Promise<SyncResult>;
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConfigure: (integration: Integration) => void;
  onSyncAll: () => Promise<void>;
  onCheckAllHealth: () => Promise<void>;
  onExportData: () => void;
  isLoading: boolean;
}

const IntegrationOverview: React.FC<IntegrationOverviewProps> = ({
  integrations,
  onTestConnection,
  onSync,
  onConnect,
  onDisconnect,
  onDelete,
  onConfigure,
  onSyncAll,
  onCheckAllHealth,
  onExportData,
  isLoading,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-400 bg-green-400/20 border-green-400/50';
      case 'disconnected':
        return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
      case 'error':
        return 'text-red-400 bg-red-400/20 border-red-400/50';
      case 'syncing':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/50';
      case 'maintenance':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
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
      claude: '🧠',
    };
    return icons[platform] || '🔗';
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      social_media: '📱',
      analytics: '📊',
      crm: '👥',
      email: '📧',
      storage: '💾',
      ai_service: '🤖',
    };
    return icons[type] || '🔗';
  };

  const getHealthScore = (integration: Integration) => {
    switch (integration.status) {
      case 'connected':
        return 95;
      case 'syncing':
        return 85;
      case 'maintenance':
        return 60;
      case 'disconnected':
        return 40;
      case 'error':
        return 20;
      default:
        return 50;
    }
  };

  return (
    <div className="space-y-8">
      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getPlatformIcon(integration.platform)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                  <p className="text-sm text-white/70 capitalize">
                    {integration.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}
              >
                {integration.status}
              </div>
            </div>

            {/* Platform Info */}
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">{getTypeIcon(integration.type)}</span>
              <span className="text-white/80 capitalize">{integration.platform}</span>
            </div>

            {/* Health Score */}
            {(() => {
              const healthScore = getHealthScore(integration);

              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">Health Score</span>
                    <span className={`text-lg font-bold ${getHealthScoreColor(healthScore)}`}>
                      {healthScore}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Last Sync */}
            {integration.lastSync && (
              <div className="mb-4">
                <p className="text-xs text-white/60">Last Sync</p>
                <p className="text-sm text-white/80">
                  {new Date(integration.lastSync).toLocaleString()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onTestConnection(integration.id)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-blue-500/20 text-blue-300 text-xs rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                Test
              </button>
              <button
                onClick={() => onSync(integration.id)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-green-500/20 text-green-300 text-xs rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                Sync
              </button>
              <button
                onClick={() => onConfigure(integration)}
                className="px-3 py-1.5 bg-purple-500/20 text-purple-300 text-xs rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                Configure
              </button>
              {integration.status === 'connected' ? (
                <button
                  onClick={() => onDisconnect(integration.id)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-red-500/20 text-red-300 text-xs rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => onConnect(integration.id)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-green-500/20 text-green-300 text-xs rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  Connect
                </button>
              )}
              <button
                onClick={() => onDelete(integration.id)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-red-500/20 text-red-300 text-xs rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {integrations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-2xl font-semibold text-white mb-2">No Integrations Yet</h3>
          <p className="text-white/70 mb-6">Connect your first platform to get started</p>
          <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
            Add Integration
          </button>
        </motion.div>
      )}

      {/* Quick Actions */}
      {integrations.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={onSyncAll}
              disabled={isLoading}
              className="bg-blue-500/20 text-blue-300 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Sync All Integrations</span>
            </button>
            <button
              onClick={onCheckAllHealth}
              disabled={isLoading}
              className="bg-green-500/20 text-green-300 px-6 py-3 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <span>🏥</span>
              <span>Health Check All</span>
            </button>
            <button
              onClick={onExportData}
              className="bg-purple-500/20 text-purple-300 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center space-x-2"
            >
              <span>📤</span>
              <span>Export Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Integration Metrics */}
      {integrations.length > 0 && (
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
                  {integrations.filter((i) => i.status === 'connected').length}
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
                  {integrations.filter((i) => i.status === 'error').length}
                </p>
                <p className="text-sm text-white/70">Errors</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🏥</span>
              <div>
                <p className="text-2xl font-bold text-white">
                  {Math.round(
                    integrations.reduce((sum, i) => sum + getHealthScore(i), 0) /
                      integrations.length
                  )}
                  %
                </p>
                <p className="text-sm text-white/70">Avg Health</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationOverview;
