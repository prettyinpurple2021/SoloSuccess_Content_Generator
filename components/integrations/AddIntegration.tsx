import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreateIntegrationData, IntegrationType } from '../../types';
import IntegrationCredentialsForm from './IntegrationCredentialsForm';

interface AddIntegrationProps {
  onCreateIntegration: (data: CreateIntegrationData) => Promise<void>;
  isLoading: boolean;
}

const AddIntegration: React.FC<AddIntegrationProps> = ({
  onCreateIntegration,
  isLoading
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [integrationType, setIntegrationType] = useState<IntegrationType>('social_media');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  const availableIntegrations = {
    social_media: [
      { 
        id: 'twitter', 
        name: 'Twitter/X', 
        icon: '🐦', 
        description: 'Post tweets and sync engagement data',
        color: 'from-blue-400 to-blue-600'
      },
      { 
        id: 'linkedin', 
        name: 'LinkedIn', 
        icon: '💼', 
        description: 'Share professional content and network',
        color: 'from-blue-500 to-blue-700'
      },
      { 
        id: 'facebook', 
        name: 'Facebook', 
        icon: '📘', 
        description: 'Post to pages and groups',
        color: 'from-blue-600 to-blue-800'
      },
      { 
        id: 'instagram', 
        name: 'Instagram', 
        icon: '📷', 
        description: 'Share photos and stories',
        color: 'from-pink-400 to-pink-600'
      },
      { 
        id: 'bluesky', 
        name: 'BlueSky', 
        icon: '☁️', 
        description: 'Decentralized social networking',
        color: 'from-sky-400 to-sky-600'
      },
      { 
        id: 'reddit', 
        name: 'Reddit', 
        icon: '🤖', 
        description: 'Share posts and engage with communities',
        color: 'from-orange-500 to-orange-700'
      },
      { 
        id: 'pinterest', 
        name: 'Pinterest', 
        icon: '📌', 
        description: 'Share and discover visual content',
        color: 'from-red-500 to-red-700'
      },
      { 
        id: 'youtube', 
        name: 'YouTube', 
        icon: '📺', 
        description: 'Upload videos and manage channel',
        color: 'from-red-500 to-red-700'
      }
    ],
    analytics: [
      { 
        id: 'google_analytics', 
        name: 'Google Analytics', 
        icon: '📊', 
        description: 'Track website and content performance',
        color: 'from-orange-400 to-orange-600'
      },
      { 
        id: 'facebook_analytics', 
        name: 'Facebook Analytics', 
        icon: '📈', 
        description: 'Monitor social media performance',
        color: 'from-blue-500 to-blue-700'
      },
      { 
        id: 'twitter_analytics', 
        name: 'Twitter Analytics', 
        icon: '📉', 
        description: 'Analyze tweet performance and engagement',
        color: 'from-blue-400 to-blue-600'
      }
    ],
    ai_service: [
      { 
        id: 'openai', 
        name: 'OpenAI', 
        icon: '🤖', 
        description: 'Advanced AI content generation',
        color: 'from-green-500 to-green-700'
      },
      { 
        id: 'claude', 
        name: 'Claude', 
        icon: '🧠', 
        description: 'Anthropic AI assistant',
        color: 'from-purple-500 to-purple-700'
      }
    ],
    crm: [
      { 
        id: 'hubspot', 
        name: 'HubSpot', 
        icon: '🎯', 
        description: 'Customer relationship management',
        color: 'from-orange-500 to-orange-700'
      },
      { 
        id: 'salesforce', 
        name: 'Salesforce', 
        icon: '☁️', 
        description: 'Cloud-based CRM platform',
        color: 'from-blue-500 to-blue-700'
      }
    ],
    email: [
      { 
        id: 'mailchimp', 
        name: 'Mailchimp', 
        icon: '📧', 
        description: 'Email marketing automation',
        color: 'from-yellow-500 to-yellow-700'
      },
      { 
        id: 'sendgrid', 
        name: 'SendGrid', 
        icon: '📮', 
        description: 'Email delivery service',
        color: 'from-blue-500 to-blue-700'
      }
    ],
    storage: [
      { 
        id: 'google_drive', 
        name: 'Google Drive', 
        icon: '💾', 
        description: 'Cloud storage and file sharing',
        color: 'from-blue-500 to-blue-700'
      },
      { 
        id: 'dropbox', 
        name: 'Dropbox', 
        icon: '📁', 
        description: 'File hosting and synchronization',
        color: 'from-blue-600 to-blue-800'
      }
    ]
  };

  const handleConnect = async () => {
    if (!selectedPlatform) {
      alert('Please select a platform first');
      return;
    }

    if (Object.keys(credentials).length === 0) {
      alert('Please provide credentials');
      return;
    }

    setIsConnecting(true);
    try {
      const integrationData: CreateIntegrationData = {
        name: `${availableIntegrations[integrationType].find(p => p.id === selectedPlatform)?.name} Integration`,
        type: integrationType,
        platform: selectedPlatform,
        credentials: credentials,
        syncFrequency: 'hourly'
      };

      await onCreateIntegration(integrationData);
      
      // Reset form
      setSelectedPlatform('');
      setCredentials({});
    } catch (error) {
      console.error('Failed to create integration:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCredentialsChange = (newCredentials: Record<string, string>) => {
    setCredentials(newCredentials);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Add New Integration</h2>
        <p className="text-xl text-white/80">Connect your favorite platforms to streamline your workflow</p>
      </div>

      {/* Integration Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-xl font-medium text-white mb-6">
          Choose Integration Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(availableIntegrations).map(([type, platforms]) => (
            <motion.button
              key={type}
              onClick={() => {
                setIntegrationType(type as IntegrationType);
                setSelectedPlatform('');
                setCredentials({});
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 border-2 rounded-xl text-left transition-all duration-300 ${
                integrationType === type
                  ? 'border-purple-400 bg-white/20 shadow-lg'
                  : 'border-white/20 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold capitalize text-white text-lg">
                  {type.replace('_', ' ')}
                </div>
                <div className="text-3xl">
                  {type === 'social_media' && '📱'}
                  {type === 'analytics' && '📊'}
                  {type === 'crm' && '👥'}
                  {type === 'email' && '📧'}
                  {type === 'storage' && '💾'}
                  {type === 'ai_service' && '🤖'}
                </div>
              </div>
              <div className="text-lg text-white/70">{platforms.length} integrations available</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Platform Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-xl font-medium text-white mb-6">
          Select Platform
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableIntegrations[integrationType].map(platform => (
            <motion.div
              key={platform.id}
              onClick={() => {
                setSelectedPlatform(platform.id);
                setCredentials({});
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                selectedPlatform === platform.id
                  ? 'border-purple-400 bg-white/20 shadow-lg'
                  : 'border-white/20 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">{platform.icon}</div>
                <div>
                  <div className="font-bold text-white text-lg">{platform.name}</div>
                  <div className="text-lg text-white/70">{platform.description}</div>
                </div>
              </div>
              <div className={`h-1 rounded-full bg-gradient-to-r ${platform.color} ${
                selectedPlatform === platform.id ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-200`}></div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Credentials Form */}
      {selectedPlatform && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <IntegrationCredentialsForm
            platform={selectedPlatform}
            type={integrationType}
            credentials={credentials}
            onCredentialsChange={handleCredentialsChange}
            onConnect={handleConnect}
            isConnecting={isConnecting || isLoading}
          />
        </motion.div>
      )}

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Need Help?</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Social Media:</strong> Connect your social accounts to automatically post content and sync engagement data</p>
          <p>• <strong>Analytics:</strong> Track performance across platforms and get detailed insights</p>
          <p>• <strong>AI Services:</strong> Enhance your content with AI-powered generation and analysis</p>
          <p>• <strong>CRM:</strong> Sync customer data and manage relationships</p>
          <p>• <strong>Email:</strong> Automate email campaigns and track delivery</p>
          <p>• <strong>Storage:</strong> Backup and sync files across cloud platforms</p>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>🔒 Security:</strong> All credentials are encrypted using AES-256-GCM encryption and stored securely. 
            We never store your credentials in plain text.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AddIntegration;