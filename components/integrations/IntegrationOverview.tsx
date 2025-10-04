import React from 'react';
import { motion } from 'framer-motion';
import { 
  Integration, 
  ConnectionTestResult, 
  SyncResult,
  IntegrationLoadingState
} from '../../types';
import IntegrationCard from './IntegrationCard';
import IntegrationMetrics from './IntegrationMetrics';

interface IntegrationOverviewProps {
  integrations: Integration[];
  isLoading: boolean;
  onTestConnection: (id: string) => Promise<ConnectionTestResult>;
  onSync: (id: string) => Promise<SyncResult>;
  onConfigure: (integration: Integration) => void;
  onDelete: (id: string) => void;
  onSyncAll: () => void;
  onCheckAllHealth: () => void;
  onExportData: () => void;
  loadingStates: IntegrationLoadingState;
}

const IntegrationOverview: React.FC<IntegrationOverviewProps> = ({
  integrations,
  isLoading,
  onTestConnection,
  onSync,
  onConfigure,
  onDelete,
  onSyncAll,
  onCheckAllHealth,
  onExportData,
  loadingStates
}) => {
  // Calculate summary statistics
  const totalIntegrations = integrations.length;
  const connectedIntegrations = integrations.filter(i => i.status === 'connected').length;
  const errorIntegrations = integrations.filter(i => i.status === 'error').length;
  const syncingIntegrations = integrations.filter(i => i.status === 'syncing').length;

  // Get integrations by type
  const integrationsByType = integrations.reduce((acc, integration) => {
    if (!acc[integration.type]) {
      acc[integration.type] = [];
    }
    acc[integration.type].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

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
            <div className="text-red-200 text-3xl">❌</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Syncing</p>
              <p className="text-3xl font-bold">{syncingIntegrations}</p>
            </div>
            <div className="text-yellow-200 text-3xl">🔄</div>
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
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">⚡</span>
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onSyncAll}
            disabled={loadingStates.sync || integrations.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {loadingStates.sync ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Syncing...
              </>
            ) : (
              <>
                <span className="mr-2">🔄</span>
                Sync All Integrations
              </>
            )}
          </button>
          
          <button
            onClick={onCheckAllHealth}
            disabled={loadingStates.healthCheck || integrations.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {loadingStates.healthCheck ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </>
            ) : (
              <>
                <span className="mr-2">🏥</span>
                Health Check All
              </>
            )}
          </button>
          
          <button
            onClick={onExportData}
            disabled={integrations.length === 0}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            <span className="mr-2">📥</span>
            Export Data
          </button>
        </div>
      </motion.div>

      {/* Integration Cards by Type */}
      {Object.keys(integrationsByType).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(integrationsByType).map(([type, typeIntegrations], index) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 capitalize flex items-center">
                  <span className="mr-2">
                    {type === 'social_media' && '📱'}
                    {type === 'analytics' && '📊'}
                    {type === 'crm' && '👥'}
                    {type === 'email' && '📧'}
                    {type === 'storage' && '💾'}
                    {type === 'ai_service' && '🤖'}
                  </span>
                  {type.replace('_', ' ')} Integrations
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                    {typeIntegrations.length}
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onTestConnection={onTestConnection}
                    onSync={onSync}
                    onConfigure={onConfigure}
                    onDelete={onDelete}
                    loadingStates={loadingStates}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Integrations Yet</h3>
          <p className="text-gray-500 mb-6">
            Get started by adding your first integration to connect with external platforms.
          </p>
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              <p>Supported platforms:</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {['Twitter/X', 'LinkedIn', 'Facebook', 'Instagram', 'Google Analytics', 'OpenAI', 'Claude'].map(platform => (
                  <span key={platform} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Integration Metrics */}
      {integrations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <IntegrationMetrics integrations={integrations} />
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && integrations.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading integrations...</span>
        </div>
      )}
    </div>
  );
};

export default IntegrationOverview;
