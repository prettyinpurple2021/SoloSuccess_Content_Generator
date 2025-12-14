import React, { useState } from 'react';
import { useUser } from '@stackframe/react';
import { motion } from 'framer-motion';

interface AccountSettingsProps {
  onNavigateBack?: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onNavigateBack }) => {
  const stackUser = useUser();
  const [activeTab, setActiveTab] = useState<'security' | 'account' | 'danger'>('security');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    setError('');
    setMessage('');

    // Require user to type "DELETE" to confirm
    if (deleteConfirmation !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion');
      return;
    }

    if (!stackUser?.id) {
      setError('User ID not found. Please refresh and try again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': stackUser.id,
        },
        body: JSON.stringify({
          confirmationCode: 'DELETE',
          userId: stackUser.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      setMessage('Account deleted successfully. Redirecting...');
      setTimeout(() => {
        window.location.href = '/auth/signin';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!stackUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-gray-600">Loading user information...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      {onNavigateBack && (
        <div className="max-w-4xl mx-auto mb-6">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8"
          >
            <span>←</span> Back to Dashboard
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-white/60">Manage your account security and preferences</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-white/10">
            {[
              { id: 'security', label: '🔒 Security' },
              { id: 'account', label: '👤 Account Info' },
              { id: 'danger', label: '⚠️ Danger Zone' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'security' | 'account' | 'danger')}
                className={`px-4 py-3 font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-white border-cyan-500'
                    : 'text-white/60 border-transparent hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Password & Security</h2>

                  <div className="space-y-6">
                    {/* Password Reset Section */}
                    <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Change Password</h3>
                      <p className="text-white/60 mb-4">
                        Update your password to secure your account
                      </p>
                      <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                        Send Password Reset Email
                      </button>
                    </div>

                    {/* 2FA Info Section */}
                    <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-white/60 mb-4">
                        Two-factor authentication is managed through your Stack Auth provider
                      </p>
                      <div className="bg-white/5 border border-white/10 rounded p-4">
                        <p className="text-sm text-white/50">
                          2FA Status: <span className="text-cyan-400 font-semibold">Managed by Auth Provider</span>
                        </p>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Active Sessions</h3>
                      <p className="text-white/60 mb-4">
                        You are currently signed in to SoloSuccess AI
                      </p>
                      <div className="bg-white/5 border border-white/10 rounded p-4">
                        <p className="text-sm text-white/70">
                          <span className="text-white">Current Session</span>
                          <span className="text-white/50 ml-2">• Active</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Account Info Tab */}
            {activeTab === 'account' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Account Information</h2>

                  <div className="space-y-6">
                    {/* Email */}
                    <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                      <label className="block text-sm font-semibold text-white/60 mb-2">
                        Email Address
                      </label>
                      <div className="text-xl font-semibold text-white break-all">
                        {stackUser?.primaryEmail || stackUser?.displayName || 'Not available'}
                      </div>
                      <p className="text-sm text-white/50 mt-2">
                        Your primary contact email for account management
                      </p>
                    </div>

                    {/* User ID */}
                    <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                      <label className="block text-sm font-semibold text-white/60 mb-2">
                        User ID
                      </label>
                      <div className="text-sm font-mono text-white/70 break-all bg-black/20 rounded p-3">
                        {stackUser?.id || 'Not available'}
                      </div>
                      <p className="text-sm text-white/50 mt-2">
                        Your unique identifier in the system
                      </p>
                    </div>

                    {/* Account Status */}
                    <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                      <label className="block text-sm font-semibold text-white/60 mb-2">
                        Account Status
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white font-semibold">Active</span>
                      </div>
                      <p className="text-sm text-white/50 mt-2">
                        Your account is in good standing
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Danger Zone</h2>
                  <p className="text-white/60 mb-6">
                    Irreversible actions that will permanently affect your account
                  </p>

                  <div className="space-y-6">
                    {/* Delete Account */}
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-red-400 mb-2">Delete Account</h3>
                      <p className="text-white/60 mb-4">
                        Permanently delete your account and all associated data. This action cannot be
                        undone.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                      >
                        Delete Account Permanently
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-green-900/30 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg"
              >
                {message}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg max-w-md w-full p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-red-400 mb-4">Delete Account</h2>

            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-white/80 text-sm">
                <strong>Warning:</strong> This action is irreversible. All your posts, drafts,
                integrations, and account data will be permanently deleted.
              </p>
            </div>

            <p className="text-white/70 mb-6">
              To confirm account deletion, type <strong className="text-red-400">DELETE</strong> below:
            </p>

            <input
              type="text"
              placeholder='Type "DELETE" to confirm'
              value={deleteConfirmation}
              onChange={(e) => {
                setDeleteConfirmation(e.target.value);
                setError('');
              }}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
              autoFocus
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setError('');
                  setMessage('');
                }}
                disabled={loading}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmation !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete My Account'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
