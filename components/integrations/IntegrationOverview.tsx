import React from 'react';
import { motion } from 'framer-motion';
import { Integration, ConnectionTestResult, SyncResult } from '../../types';
import IntegrationCard from './IntegrationCard';

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
  isLoading
}) => {
  // Calculate summary statistics
  const totalIntegrations = integrations.length;
  const connectedIntegrations = integrations.filter(i => i.status === 'connected').length;
  const errorIntegrations = integrations.filter(i => i.status === 'error').length;
  const activeIntegrations = integrations.filter(i => i.isActive).length;

  // Get integrations by type
  const integrationsByType = integrations.reduce((acc, integration) => {
    acc[integration.type] = (acc[integration.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get recent integrations (last 7 days)
  const recentIntegrations = integrations.filter(integration => {
    const createdAt = new Date(integration.createdAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return createdAt > sevenDaysAgo;
  });

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Integrations</p>
              <p className="text-3xl font-bold">{totalIntegrations}</p>
            </div>
            <div className="text-blue-200 text-3xl">🔗</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Connected</p>
              <p className="text-3xl font-bold">{connectedIntegrations}</p>
            </div>
            <div className="text-green-200 text-3xl">✅</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Errors</p>
              <p className="text-3xl font-bold">{errorIntegrations}</p>
            </div>
            <div className="text-red-200 text-3xl">⚠️</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active</p>
              <p className="text-3xl font-bold">{activeIntegrations}</p>
            </div>
            <div className="text-purple-200 text-3xl">⚡</div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-50 p-6 rounded-lg border"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onSyncAll}
            disabled={isLoading || integrations.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <span className="mr-2">🔄</span>
            Sync All Integrations
          </button>
          <button
            onClick={onCheckAllHealth}
            disabled={isLoading || integrations.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <span className="mr-2">🏥</span>
            Health Check All
          </button>
          <button
            onClick={onExportData}
            disabled={integrations.length === 0}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <span className="mr-2">📥</span>
            Export Data
          </button>
        </div>
      </motion.div>

      {/* Integration Type Breakdown */}
      {Object.keys(integrationsByType).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-lg border shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Integration Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(integrationsByType).map(([type, count]) => (
              <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">
                  {type === 'social_media' && '📱'}
                  {type === 'analytics' && '📊'}
                  {type === 'crm' && '👥'}
                  {type === 'email' && '📧'}
                  {type === 'storage' && '💾'}
                  {type === 'ai_service' && '🤖'}
                </div>
                <div className="font-semibold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Integrations */}
      {recentIntegrations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-lg border shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Integrations</h3>
          <div className="space-y-3">
            {recentIntegrations.slice(0, 5).map(integration => (
              <div key={integration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">
                    {integration.type === 'social_media' && '📱'}
                    {integration.type === 'analytics' && '📊'}
                    {integration.type === 'crm' && '👥'}
                    {integration.type === 'email' && '📧'}
                    {integration.type === 'storage' && '💾'}
                    {integration.type === 'ai_service' && '🤖'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{integration.name}</div>
                    <div className="text-sm text-gray-600">{integration.platform}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    integration.status === 'connected' ? 'bg-green-100 text-green-800' :
                    integration.status === 'error' ? 'bg-red-100 text-red-800' :
                    integration.status === 'syncing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {integration.status}
                  </span>
                  <button
                    onClick={() => onConfigure(integration)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Integration Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">All Integrations</h3>
          <div className="text-sm text-gray-600">
            {integrations.length} integration{integrations.length !== 1 ? 's' : ''}
          </div>
        </div>

        {integrations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first integration</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('integration-tab-change', { detail: 'add' }))}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Integration
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <IntegrationCard
                  integration={integration}
                  onTestConnection={onTestConnection}
                  onSync={onSync}
                  onConnect={onConnect}
                  onDisconnect={onDisconnect}
                  onConfigure={onConfigure}
                  onDelete={onDelete}
                  isLoading={isLoading}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default IntegrationOverview;