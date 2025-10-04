import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Integration, 
  IntegrationType, 
  SyncFrequency,
  ConnectionTestResult,
  SyncResult,
  HealthCheckResult,
  IntegrationMetrics,
  IntegrationAlert,
  IntegrationLog
} from '../types';
import { integrationService } from '../services/integrationService';
import IntegrationOverview from './integrations/IntegrationOverview';
import AddIntegration from './integrations/AddIntegration';
import ConfigureIntegration from './integrations/ConfigureIntegration';
import MonitorIntegrations from './integrations/MonitorIntegrations';

interface IntegrationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onIntegrationUpdate?: (integrations: Integration[]) => void;
}

type TabType = 'overview' | 'add' | 'configure' | 'monitor';

const IntegrationManager: React.FC<IntegrationManagerProps> = ({ 
  isOpen, 
  onClose, 
  onIntegrationUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingStates, setLoadingStates] = useState<{
    integrations?: boolean;
    connectionTest?: boolean;
    sync?: boolean;
    healthCheck?: boolean;
  }>({});

  // Load integrations on component mount
  useEffect(() => {
    if (isOpen) {
      loadIntegrations();
    }
  }, [isOpen]);

  // Load integrations
  const loadIntegrations = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, integrations: true }));
      setError('');
      
      const fetchedIntegrations = await integrationService.getIntegrations();
      setIntegrations(fetchedIntegrations);
      
      if (onIntegrationUpdate) {
        onIntegrationUpdate(fetchedIntegrations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setLoadingStates(prev => ({ ...prev, integrations: false }));
    }
  };

  // Create new integration
  const createIntegration = async (data: {
    name: string;
    type: IntegrationType;
    platform: string;
    credentials: any;
    configuration?: any;
    syncFrequency?: SyncFrequency;
  }) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const newIntegration = await integrationService.createIntegration(data);
      setIntegrations(prev => [newIntegration, ...prev]);
      
      if (onIntegrationUpdate) {
        onIntegrationUpdate([newIntegration, ...integrations]);
      }

      setSuccess('Integration created successfully');
      setActiveTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create integration');
    } finally {
      setIsLoading(false);
    }
  };

  // Update integration
  const updateIntegration = async (id: string, updates: Partial<Integration>) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const updatedIntegration = await integrationService.updateIntegration(id, updates);
      setIntegrations(prev => prev.map(integration => 
        integration.id === id ? updatedIntegration : integration
      ));
      
      if (onIntegrationUpdate) {
        onIntegrationUpdate(integrations.map(integration => 
          integration.id === id ? updatedIntegration : integration
        ));
      }

      setSuccess('Integration updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update integration');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete integration
  const deleteIntegration = async (id: string) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      await integrationService.deleteIntegration(id);
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
      
      if (onIntegrationUpdate) {
        onIntegrationUpdate(integrations.filter(integration => integration.id !== id));
      }

      setSuccess('Integration deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete integration');
    } finally {
      setIsLoading(false);
    }
  };

  // Test connection
  const testConnection = async (id: string): Promise<ConnectionTestResult> => {
    try {
      setLoadingStates(prev => ({ ...prev, connectionTest: true }));
      setError('');

      const result = await integrationService.testConnection(id);
      
      // Update integration status based on test result
      if (result.success) {
        await updateIntegration(id, { status: 'connected' });
        setSuccess('Connection test successful');
      } else {
        await updateIntegration(id, { status: 'error' });
        setError(`Connection test failed: ${result.error}`);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Connection test failed';
      setError(error);
      return {
        success: false,
        error,
        responseTime: 0,
        timestamp: new Date()
      };
    } finally {
      setLoadingStates(prev => ({ ...prev, connectionTest: false }));
    }
  };

  // Sync integration
  const syncIntegration = async (id: string): Promise<SyncResult> => {
    try {
      setLoadingStates(prev => ({ ...prev, sync: true }));
      setError('');

      const result = await integrationService.syncIntegration(id);
      
      if (result.success) {
        setSuccess('Sync completed successfully');
        await loadIntegrations(); // Refresh to get updated data
      } else {
        setError(`Sync failed: ${result.errors.join(', ')}`);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Sync failed';
      setError(error);
      return {
        integrationId: id,
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [error],
        duration: 0,
        timestamp: new Date()
      };
    } finally {
      setLoadingStates(prev => ({ ...prev, sync: false }));
    }
  };

  // Check integration health
  const checkIntegrationHealth = async (id: string): Promise<HealthCheckResult> => {
    try {
      setLoadingStates(prev => ({ ...prev, healthCheck: true }));
      setError('');

      const result = await integrationService.checkIntegrationHealth(id);
      setSuccess(`Health check completed. Score: ${result.healthScore}/100`);

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Health check failed';
      setError(error);
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, healthCheck: false }));
    }
  };

  // Sync all integrations
  const syncAllIntegrations = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const results = await integrationService.syncAll();
      const successfulSyncs = results.filter(r => r.success).length;
      const failedSyncs = results.filter(r => !r.success).length;

      if (failedSyncs === 0) {
        setSuccess(`All ${successfulSyncs} integrations synced successfully`);
      } else {
        setError(`${failedSyncs} out of ${results.length} integrations failed to sync`);
      }

      await loadIntegrations(); // Refresh to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync integrations');
    } finally {
      setIsLoading(false);
    }
  };

  // Check health for all integrations
  const checkAllHealth = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const healthChecks = await Promise.allSettled(
        integrations.map(integration => checkIntegrationHealth(integration.id))
      );

      const successfulChecks = healthChecks.filter(check => check.status === 'fulfilled').length;
      const failedChecks = healthChecks.filter(check => check.status === 'rejected').length;

      if (failedChecks === 0) {
        setSuccess(`Health checks completed for all ${successfulChecks} integrations`);
      } else {
        setError(`${failedChecks} out of ${integrations.length} health checks failed`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check integration health');
    } finally {
      setIsLoading(false);
    }
  };

  // Export integration data
  const exportIntegrationData = () => {
    try {
      const dataStr = JSON.stringify(integrations, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `integrations-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Integration data exported successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export integration data');
    }
  };

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Tab configuration
  const tabs = [
    { key: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { key: 'add' as TabType, label: 'Add Integration', icon: '➕' },
    { key: 'configure' as TabType, label: 'Configure', icon: '⚙️' },
    { key: 'monitor' as TabType, label: 'Monitor', icon: '📈' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div>
              <h2 className="text-2xl font-bold">Integration Manager</h2>
              <p className="text-blue-100 text-sm mt-1">
                Manage your external platform integrations
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b bg-gray-50">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-all duration-200 flex items-center ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          {(error || success) && (
            <div className="px-6 py-3">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={clearMessages} className="text-red-400 hover:text-red-600">
                    ×
                  </button>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
                  <span>{success}</span>
                  <button onClick={clearMessages} className="text-green-400 hover:text-green-600">
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <IntegrationOverview
                    integrations={integrations}
                    isLoading={loadingStates.integrations}
                    onTestConnection={testConnection}
                    onSync={syncIntegration}
                    onConfigure={(integration) => {
                      setSelectedIntegration(integration);
                      setActiveTab('configure');
                    }}
                    onDelete={deleteIntegration}
                    onSyncAll={syncAllIntegrations}
                    onCheckAllHealth={checkAllHealth}
                    onExportData={exportIntegrationData}
                    loadingStates={loadingStates}
                  />
                </motion.div>
              )}

              {activeTab === 'add' && (
                <motion.div
                  key="add"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AddIntegration
                    onCreateIntegration={createIntegration}
                    isLoading={isLoading}
                    existingIntegrations={integrations}
                  />
                </motion.div>
              )}

              {activeTab === 'configure' && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ConfigureIntegration
                    integration={selectedIntegration}
                    integrations={integrations}
                    onUpdateIntegration={updateIntegration}
                    onSelectIntegration={setSelectedIntegration}
                    isLoading={isLoading}
                  />
                </motion.div>
              )}

              {activeTab === 'monitor' && (
                <motion.div
                  key="monitor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <MonitorIntegrations
                    integrations={integrations}
                    onCheckHealth={checkIntegrationHealth}
                    loadingStates={loadingStates}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntegrationManager;