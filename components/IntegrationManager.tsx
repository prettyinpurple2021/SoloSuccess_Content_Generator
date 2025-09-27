import React from 'react';

interface IntegrationManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const IntegrationManager: React.FC<IntegrationManagerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Integration Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600">Integration Manager is being implemented...</p>
          <p className="text-sm text-gray-500 mt-2">
            This component will allow you to manage external platform integrations,
            configure webhooks, and monitor integration status.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntegrationManager;