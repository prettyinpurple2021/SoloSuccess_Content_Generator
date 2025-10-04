import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Integration, 
  CreateIntegrationData, 
  UpdateIntegrationData,
  ConnectionTestResult,
  SyncResult,
  HealthCheckResult,
  IntegrationType,
  SyncFrequency
} from '../types';
import { integrationService } from '../services/integrationService';
import IntegrationOverview from './integrations/IntegrationOverview';
import AddIntegration from './integrations/AddIntegration';
import ConfigureIntegration from './integrations/ConfigureIntegration';
import MonitorIntegrations from './integrations/MonitorIntegrations';

interface IntegrationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onIntegrationUpdate?: (integration: Integration) => void;
}

type ActiveTab = 'overview' | 'add' | 'configure' | 'monitor';

const IntegrationManager: React.FC<IntegrationManagerProps> = ({
  isOpen,
  onClose,
  onIntegrationUpdate
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load integrations on component mount
  useEffect(() => {
    if (isOpen) {
      loadIntegrations();
    }
  }, [isOpen]);

  // Load all integrations
  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await integrationService.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new integration
  const createIntegration = async (data: CreateIntegrationData) => {
    try {
      setIsLoading(true);
      setError('');
      const newIntegration = await integrationService.createIntegration(data);
      setIntegrations(prev => [...prev, newIntegration]);
      setSuccess('Integration created successfully');
      setActiveTab('overview');
      onIntegrationUpdate?.(newIntegration);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create integration');
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing integration
  const updateIntegration = async (id: string, updates: UpdateIntegrationData) => {
    try {
      setIsLoading(true);
      setError('');
      const updatedIntegration = await integrationService.updateIntegration(id, updates);
      setIntegrations(prev => prev.map(i => i.id === id ? updatedIntegration : i));
      setSuccess('Integration updated successfully');
      onIntegrationUpdate?.(updatedIntegration);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update integration');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete integration
  const deleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await integrationService.deleteIntegration(id);
      setIntegrations(prev => prev.filter(i => i.id !== id));
      setSuccess('Integration deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete integration');
    } finally {
      setIsLoading(false);
    }
  };

  // Test connection
  const testConnection = async (id: string): Promise<ConnectionTestResult> => {
    try {
      setIsLoading(true);
      setError('');
      const result = await integrationService.testConnection(id);
      
      if (result.success) {
        setSuccess('Connection test successful');
        // Update integration status
        const integration = integrations.find(i => i.id === id);
        if (integration) {
          const updatedIntegration = { ...integration, status: 'connected' as const };
          setIntegrations(prev => prev.map(i => i.id === id ? updatedIntegration : i));
        }
      } else {
        setError(`Connection test failed: ${result.error}`);
      }
      
      // Clear messages after 3 seconds
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      setTimeout(() => setError(''), 3000);
      return {
        success: false,
        error: errorMessage,
        responseTime: 0,
        timestamp: new Date()
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sync integration
  const syncIntegration = async (id: string): Promise<SyncResult> => {
    try {
      setIsLoading(true);
      setError('');
      const result = await integrationService.syncIntegration(id);
      
      if (result.success) {
        setSuccess(`Sync completed: ${result.recordsProcessed} records processed`);
        // Update integration last sync time
        const integration = integrations.find(i => i.id === id);
        if (integration) {
          const updatedIntegration = { ...integration, lastSync: result.timestamp };
          setIntegrations(prev => prev.map(i => i.id === id ? updatedIntegration : i));
        }
      } else {
        setError(`Sync failed: ${result.errors.join(', ')}`);
      }
      
      // Clear messages after 5 seconds
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
      return {
        integrationId: id,
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [errorMessage],
        duration: 0,
        timestamp: new Date()
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Health check
  const checkHealth = async (id: string): Promise<HealthCheckResult> => {
    try {
      setIsLoading(true);
      setError('');
      const result = await integrationService.checkIntegrationHealth(id);
      setSuccess(`Health check completed: ${result.healthScore}% health score`);
      setTimeout(() => setSuccess(''), 3000);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
      setTimeout(() => setError(''), 3000);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Connect integration
  const connectIntegration = async (id: string) => {
    try {
      setIsLoading(true);
      setError('');
      const success = await integrationService.connectIntegration(id);
      
      if (success) {
        setSuccess('Integration connected successfully');
        // Update integration status
        const integration = integrations.find(i => i.id === id);
        if (integration) {
          const updatedIntegration = { ...integration, status: 'connected' as const };
          setIntegrations(prev => prev.map(i => i.id === id ? updatedIntegration : i));
        }
      } else {
        setError('Failed to connect integration');
      }
      
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect integration');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect integration
  const disconnectIntegration = async (id: string) => {
    try {
      setIsLoading(true);
      setError('');
      await integrationService.disconnectIntegration(id);
      setSuccess('Integration disconnected successfully');
      
      // Update integration status
      const integration = integrations.find(i => i.id === id);
      if (integration) {
        const updatedIntegration = { ...integration, status: 'disconnected' as const };
        setIntegrations(prev => prev.map(i => i.id === id ? updatedIntegration : i));
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect integration');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync all integrations
  const syncAllIntegrations = async () => {
    try {
      setIsLoading(true);
      setError('');
      const results = await integrationService.syncAll();
      const successful = results.filter(r => r.success).length;
      const total = results.length;
      setSuccess(`Sync completed: ${successful}/${total} integrations synced successfully`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync all integrations');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Check all health
  const checkAllHealth = async () => {
    try {
      setIsLoading(true);
      setError('');
      const healthChecks = await Promise.allSettled(
        integrations.map(integration => integrationService.checkIntegrationHealth(integration.id))
      );
      const successful = healthChecks.filter(h => h.status === 'fulfilled').length;
      const total = healthChecks.length;
      setSuccess(`Health check completed: ${successful}/${total} integrations checked`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check all integrations health');
      setTimeout(() => setError(''), 5000);
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
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to export integration data');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'add', label: 'Add Integration', icon: '➕' },
    { key: 'configure', label: 'Configure', icon: '⚙️' },
    { key: 'monitor', label: 'Monitor', icon: '📈' }
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Integration Manager</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your external platform integrations</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Alert Messages */}
          {(error || success) && (
            <div className="px-6 py-3">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  {success}
                </div>
              )}
            </div>
          )}

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

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Processing...</span>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <IntegrationOverview
                    integrations={integrations}
                    onTestConnection={testConnection}
                    onSync={syncIntegration}
                    onConnect={connectIntegration}
                    onDisconnect={disconnectIntegration}
                    onDelete={deleteIntegration}
                    onConfigure={(integration) => {
                      setSelectedIntegration(integration);
                      setActiveTab('configure');
                    }}
                    onSyncAll={syncAllIntegrations}
                    onCheckAllHealth={checkAllHealth}
                    onExportData={exportIntegrationData}
                    isLoading={isLoading}
                  />
                )}
                {activeTab === 'add' && (
                  <AddIntegration
                    onCreateIntegration={createIntegration}
                    isLoading={isLoading}
                  />
                )}
                {activeTab === 'configure' && (
                  <ConfigureIntegration
                    integration={selectedIntegration}
                    onUpdateIntegration={updateIntegration}
                    onTestConnection={testConnection}
                    onSync={syncIntegration}
                    onCheckHealth={checkHealth}
                    onBack={() => {
                      setSelectedIntegration(null);
                      setActiveTab('overview');
                    }}
                    isLoading={isLoading}
                  />
                )}
                {activeTab === 'monitor' && (
                  <MonitorIntegrations
                    integrations={integrations}
                    onRefresh={loadIntegrations}
                    isLoading={isLoading}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntegrationManager;