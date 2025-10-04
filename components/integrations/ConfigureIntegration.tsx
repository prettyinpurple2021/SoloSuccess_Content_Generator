import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Integration, 
  UpdateIntegrationData, 
  ConnectionTestResult, 
  SyncResult, 
  HealthCheckResult,
  SyncFrequency,
  WebhookConfig
} from '../../types';
import WebhookManager from './WebhookManager';

interface ConfigureIntegrationProps {
  integration: Integration | null;
  onUpdateIntegration: (id: string, updates: UpdateIntegrationData) => Promise<void>;
  onTestConnection: (id: string) => Promise<ConnectionTestResult>;
  onSync: (id: string) => Promise<SyncResult>;
  onCheckHealth: (id: string) => Promise<HealthCheckResult>;
  onBack: () => void;
  isLoading: boolean;
}

const ConfigureIntegration: React.FC<ConfigureIntegrationProps> = ({
  integration,
  onUpdateIntegration,
  onTestConnection,
  onSync,
  onCheckHealth,
  onBack,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'sync' | 'webhooks' | 'advanced'>('general');
  const [formData, setFormData] = useState<UpdateIntegrationData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);

  // Initialize form data when integration changes
  useEffect(() => {
    if (integration) {
      setFormData({
        name: integration.name,
        syncFrequency: integration.syncFrequency,
        isActive: integration.isActive,
        configuration: integration.configuration
      });
    }
  }, [integration]);

  if (!integration) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No integration selected</h3>
        <p className="text-gray-600 mb-4">Please select an integration to configure</p>
        <button
          onClick={onBack}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Overview
        </button>
      </div>
    );
  }

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle configuration changes
  const handleConfigChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [section]: {
          ...prev.configuration?.[section],
          [field]: value
        }
      }
    }));
  };

  // Save configuration
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateIntegration(integration.id, formData);
    } finally {
      setIsSaving(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    try {
      const result = await onTestConnection(integration.id);
      setTestResult(result);
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  // Test sync
  const handleTestSync = async () => {
    try {
      const result = await onSync(integration.id);
      setSyncResult(result);
    } catch (error) {
      console.error('Sync test failed:', error);
    }
  };

  // Check health
  const handleCheckHealth = async () => {
    try {
      const result = await onCheckHealth(integration.id);
      setHealthResult(result);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const tabs = [
    { key: 'general', label: 'General', icon: '⚙️' },
    { key: 'sync', label: 'Sync Settings', icon: '🔄' },
    { key: 'webhooks', label: 'Webhooks', icon: '🔗' },
    { key: 'advanced', label: 'Advanced', icon: '🔧' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{integration.name}</h2>
            <p className="text-sm text-gray-600 capitalize">
              {integration.platform.replace('_', ' ')} • {integration.type.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            integration.status === 'connected' ? 'bg-green-100 text-green-800' :
            integration.status === 'error' ? 'bg-red-100 text-red-800' :
            integration.status === 'syncing' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {integration.status}
          </span>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Integration Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Frequency
                </label>
                <select
                  value={formData.syncFrequency || 'hourly'}
                  onChange={(e) => handleInputChange('syncFrequency', e.target.value as SyncFrequency)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive ?? true}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active Integration
              </label>
            </div>

            {/* Test Connection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Connection Test</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleTestConnection}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Test Connection
                </button>
                {testResult && (
                  <div className={`flex items-center space-x-2 ${
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span>{testResult.success ? '✅' : '❌'}</span>
                    <span className="text-sm">
                      {testResult.success ? 'Connection successful' : testResult.error}
                    </span>
                    {testResult.responseTime && (
                      <span className="text-xs text-gray-500">
                        ({testResult.responseTime}ms)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sync Settings */}
        {activeTab === 'sync' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Sync
                </label>
                <select
                  value={formData.configuration?.syncSettings?.autoSync ? 'true' : 'false'}
                  onChange={(e) => handleConfigChange('syncSettings', 'autoSync', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Interval (minutes)
                </label>
                <input
                  type="number"
                  value={formData.configuration?.syncSettings?.syncInterval || 60}
                  onChange={(e) => handleConfigChange('syncSettings', 'syncInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Size
                </label>
                <input
                  type="number"
                  value={formData.configuration?.syncSettings?.batchSize || 100}
                  onChange={(e) => handleConfigChange('syncSettings', 'batchSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retry Attempts
                </label>
                <input
                  type="number"
                  value={formData.configuration?.syncSettings?.retryAttempts || 3}
                  onChange={(e) => handleConfigChange('syncSettings', 'retryAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="syncOnStartup"
                  checked={formData.configuration?.syncSettings?.syncOnStartup ?? true}
                  onChange={(e) => handleConfigChange('syncSettings', 'syncOnStartup', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="syncOnStartup" className="ml-2 block text-sm text-gray-900">
                  Sync on Startup
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="syncOnSchedule"
                  checked={formData.configuration?.syncSettings?.syncOnSchedule ?? true}
                  onChange={(e) => handleConfigChange('syncSettings', 'syncOnSchedule', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="syncOnSchedule" className="ml-2 block text-sm text-gray-900">
                  Sync on Schedule
                </label>
              </div>
            </div>

            {/* Test Sync */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Sync Test</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleTestSync}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Test Sync
                </button>
                {syncResult && (
                  <div className={`flex items-center space-x-2 ${
                    syncResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span>{syncResult.success ? '✅' : '❌'}</span>
                    <span className="text-sm">
                      {syncResult.success 
                        ? `${syncResult.recordsProcessed} records processed` 
                        : syncResult.errors.join(', ')
                      }
                    </span>
                    {syncResult.duration && (
                      <span className="text-xs text-gray-500">
                        ({syncResult.duration}ms)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Webhooks */}
        {activeTab === 'webhooks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <WebhookManager integrationId={integration.id} />
          </motion.div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Rate Limits */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Rate Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requests per Minute
                  </label>
                  <input
                    type="number"
                    value={formData.configuration?.rateLimits?.requestsPerMinute || 100}
                    onChange={(e) => handleConfigChange('rateLimits', 'requestsPerMinute', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requests per Hour
                  </label>
                  <input
                    type="number"
                    value={formData.configuration?.rateLimits?.requestsPerHour || 1000}
                    onChange={(e) => handleConfigChange('rateLimits', 'requestsPerHour', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requests per Day
                  </label>
                  <input
                    type="number"
                    value={formData.configuration?.rateLimits?.requestsPerDay || 10000}
                    onChange={(e) => handleConfigChange('rateLimits', 'requestsPerDay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Burst Limit
                  </label>
                  <input
                    type="number"
                    value={formData.configuration?.rateLimits?.burstLimit || 20}
                    onChange={(e) => handleConfigChange('rateLimits', 'burstLimit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Error Handling */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Error Handling</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Retries
                  </label>
                  <input
                    type="number"
                    value={formData.configuration?.errorHandling?.maxRetries || 3}
                    onChange={(e) => handleConfigChange('errorHandling', 'maxRetries', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.configuration?.errorHandling?.retryDelay || 1000}
                    onChange={(e) => handleConfigChange('errorHandling', 'retryDelay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="exponentialBackoff"
                    checked={formData.configuration?.errorHandling?.exponentialBackoff ?? true}
                    onChange={(e) => handleConfigChange('errorHandling', 'exponentialBackoff', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="exponentialBackoff" className="ml-2 block text-sm text-gray-900">
                    Exponential Backoff
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="alertOnFailure"
                    checked={formData.configuration?.errorHandling?.alertOnFailure ?? true}
                    onChange={(e) => handleConfigChange('errorHandling', 'alertOnFailure', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="alertOnFailure" className="ml-2 block text-sm text-gray-900">
                    Alert on Failure
                  </label>
                </div>
              </div>
            </div>

            {/* Health Check */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Health Check</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCheckHealth}
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Check Health
                </button>
                {healthResult && (
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-semibold ${
                      healthResult.healthScore >= 80 ? 'text-green-600' :
                      healthResult.healthScore >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {healthResult.healthScore}%
                    </span>
                    <span className="text-sm text-gray-600">Health Score</span>
                  </div>
                )}
              </div>
              {healthResult && healthResult.recommendations.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {healthResult.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ConfigureIntegration;