/**
 * SmartPosting - Intelligent multi-platform content posting
 *
 * Features:
 * - Platform-specific content adaptation
 * - Real-time character counting
 * - Content validation
 * - Batch posting to multiple platforms
 * - Post scheduling
 * - Performance tracking
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { contentAdaptationService } from '../../services/contentAdaptationService';
import { schedulePost } from '../../services/schedulerService';
import ContentPreview from './ContentPreview';

interface SmartPostingProps {
  availableIntegrations: Array<{
    id: string;
    name: string;
    platform: string;
    status: 'connected' | 'disconnected' | 'error';
    credentials?: any;
  }>;
  onPostSuccess?: (results: Record<string, any>) => void;
  onPostError?: (error: string) => void;
}

export const SmartPosting: React.FC<SmartPostingProps> = ({
  availableIntegrations,
  onPostSuccess,
  onPostError,
}) => {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postingOptions, setPostingOptions] = useState({
    includeCallToAction: true,
    tone: 'professional' as 'professional' | 'casual' | 'friendly' | 'authoritative',
    scheduleForLater: false,
    scheduledTime: '',
    includeMedia: false,
    mediaUrls: [] as string[],
  });
  const [isPosting, setIsPosting] = useState(false);
  const [postResults, setPostResults] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Get connected integrations
  const connectedIntegrations = availableIntegrations.filter(
    (integration) => integration.status === 'connected'
  );

  // Handle platform selection
  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // Handle content change
  const handleContentChange = (value: string) => {
    setContent(value);
  };

  // Validate content for all selected platforms
  const validateAllPlatforms = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;

    const validations: Record<string, any> = {};
    let allValid = true;

    for (const platform of selectedPlatforms) {
      try {
        const validation = await socialMediaIntegrations.validateContentForPlatform(
          content,
          platform
        );
        validations[platform] = validation;
        if (!validation.isValid) {
          allValid = false;
        }
      } catch (error) {
        validations[platform] = {
          isValid: false,
          issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          suggestions: [],
        };
        allValid = false;
      }
    }

    return { validations, allValid };
  };

  // Post to selected platforms (now or schedule)
  const handlePost = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) {
      onPostError?.('Please enter content and select at least one platform');
      return;
    }

    setIsPosting(true);
    setPostResults({});

    try {
      // Validate content first
      const { validations, allValid } = await validateAllPlatforms();

      if (!allValid) {
        onPostError?.('Content validation failed. Please check the preview for issues.');
        setIsPosting(false);
        return;
      }

      // Create scheduling jobs
      const scheduleDate =
        postingOptions.scheduleForLater && postingOptions.scheduledTime
          ? new Date(postingOptions.scheduledTime).toISOString()
          : new Date().toISOString();

      await schedulePost({
        content,
        platforms: selectedPlatforms,
        scheduleDate,
        mediaUrls: postingOptions.includeMedia ? postingOptions.mediaUrls : [],
        options: {
          tone: postingOptions.tone,
          includeCallToAction: postingOptions.includeCallToAction,
        },
      });

      setPostResults(
        Object.fromEntries(selectedPlatforms.map((p) => [p, { success: true, queued: true }]))
      );
      onPostSuccess?.({ queued: true });
    } catch (error) {
      onPostError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsPosting(false);
    }
  };

  const getPlatformIcon = (platform: string): string => {
    const icons: Record<string, string> = {
      twitter: '🐦',
      linkedin: '💼',
      facebook: '📘',
      instagram: '📷',
      bluesky: '☁️',
      reddit: '🤖',
      pinterest: '📌',
      youtube: '📺',
    };
    return icons[platform] || '📱';
  };

  const getPlatformColor = (platform: string): string => {
    const colors: Record<string, string> = {
      twitter: 'from-blue-400 to-blue-600',
      linkedin: 'from-blue-500 to-blue-700',
      facebook: 'from-blue-600 to-blue-800',
      instagram: 'from-pink-400 to-pink-600',
      bluesky: 'from-sky-400 to-sky-600',
      reddit: 'from-orange-500 to-orange-700',
      pinterest: 'from-red-500 to-red-700',
      youtube: 'from-red-500 to-red-700',
    };
    return colors[platform] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Posting</h2>
        <p className="text-gray-600">
          Create content once and post it across multiple platforms with automatic optimization
        </p>
      </div>

      {/* Content Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Content</label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Write your content here... It will be automatically adapted for each platform."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">{content.length} characters</span>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-4">Select Platforms</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {connectedIntegrations.map((integration) => (
            <motion.button
              key={integration.id}
              onClick={() => handlePlatformToggle(integration.platform)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedPlatforms.includes(integration.platform)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center text-center">
                <span className="text-2xl mb-2">{getPlatformIcon(integration.platform)}</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {integration.platform}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {contentAdaptationService.getPlatformLimits(integration.platform)
                    ?.maxCharacters || 0}{' '}
                  chars
                </span>
              </div>
              {selectedPlatforms.includes(integration.platform) && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {selectedPlatforms.length === 0 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Select at least one platform to continue
          </p>
        )}
      </div>

      {/* Posting Options */}
      {selectedPlatforms.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Posting Options</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Tone</label>
              <select
                value={postingOptions.tone}
                onChange={(e) =>
                  setPostingOptions((prev) => ({ ...prev, tone: e.target.value as any }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="authoritative">Authoritative</option>
              </select>
            </div>

            {/* Call to Action */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCTA"
                checked={postingOptions.includeCallToAction}
                onChange={(e) =>
                  setPostingOptions((prev) => ({ ...prev, includeCallToAction: e.target.checked }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includeCTA" className="ml-2 text-sm text-gray-700">
                Include call-to-action
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Content Preview */}
      {showPreview && selectedPlatforms.length > 0 && (
        <ContentPreview content={content} selectedPlatforms={selectedPlatforms} />
      )}

      {/* Post Results */}
      {Object.keys(postResults).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Results</h3>
          <div className="space-y-3">
            {Object.entries(postResults).map(([platform, result]) => (
              <div
                key={platform}
                className={`p-4 rounded-lg border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">{getPlatformIcon(platform)}</span>
                    <div>
                      <h4 className="font-medium capitalize">{platform}</h4>
                      <p className="text-sm text-gray-600">
                        {result.success ? 'Posted successfully' : 'Failed to post'}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.success ? '✅' : '❌'}
                  </div>
                </div>

                {result.success && result.url && (
                  <div className="mt-2">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Post →
                    </a>
                  </div>
                )}

                {result.error && (
                  <div className="mt-2 text-sm text-red-700">Error: {result.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => {
            setContent('');
            setSelectedPlatforms([]);
            setPostResults({});
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          Clear All
        </button>

        <button
          onClick={handlePost}
          disabled={!content.trim() || selectedPlatforms.length === 0 || isPosting}
          className={`px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            !content.trim() || selectedPlatforms.length === 0 || isPosting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPosting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Posting...
            </div>
          ) : (
            `Post to ${selectedPlatforms.length} Platform${selectedPlatforms.length !== 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </div>
  );
};

export default SmartPosting;
