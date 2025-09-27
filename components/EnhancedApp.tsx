import React from 'react';
import App from '../App';
import { ErrorBoundary } from './ErrorBoundary';
import { NotificationProvider } from './NotificationSystem';
import { OnboardingFlow, useOnboarding } from './OnboardingFlow';
import { HelpSystem, HelpButton, useHelpSystem } from './HelpSystem';

/**
 * Enhanced App wrapper that provides all the new features and integrations
 */
const EnhancedApp: React.FC = () => {
  const { 
    showOnboarding, 
    hasCompletedOnboarding, 
    completeOnboarding, 
    setShowOnboarding 
  } = useOnboarding();
  
  const { 
    isOpen: isHelpOpen, 
    openHelp, 
    closeHelp, 
    initialCategory, 
    initialArticle 
  } = useHelpSystem();

  // Mock user progress - in real app, this would come from user data
  const userProgress = {
    hasCreatedBrandVoice: false,
    hasCreatedAudienceProfile: false,
    hasCreatedCampaign: false,
    hasViewedAnalytics: false,
    hasUsedTemplate: false
  };

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Main App */}
          <App />

          {/* Onboarding Flow */}
          <OnboardingFlow
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onComplete={completeOnboarding}
            userProgress={userProgress}
          />

          {/* Help System */}
          <HelpSystem
            isOpen={isHelpOpen}
            onClose={closeHelp}
            initialCategory={initialCategory}
            initialArticle={initialArticle}
          />

          {/* Floating Help Button */}
          <HelpButton onClick={() => openHelp()} />

          {/* Feature Discovery Hints */}
          {hasCompletedOnboarding && <FeatureDiscoveryHints />}
        </div>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

/**
 * Feature discovery hints for users who have completed onboarding
 */
const FeatureDiscoveryHints: React.FC = () => {
  const [showHints, setShowHints] = React.useState(false);
  const [currentHint, setCurrentHint] = React.useState(0);

  const hints = [
    {
      id: 'brand-voice',
      title: 'Try Brand Voices',
      description: 'Create consistent content with custom brand voices',
      position: 'top-20 left-4'
    },
    {
      id: 'analytics',
      title: 'Check Analytics',
      description: 'See how your content is performing',
      position: 'top-20 right-4'
    },
    {
      id: 'campaigns',
      title: 'Organize with Campaigns',
      description: 'Group related content for better coordination',
      position: 'bottom-20 left-4'
    }
  ];

  React.useEffect(() => {
    // Show hints after a delay if user hasn't seen them
    const hasSeenHints = localStorage.getItem('feature-hints-seen');
    if (!hasSeenHints) {
      const timer = setTimeout(() => {
        setShowHints(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const dismissHints = () => {
    setShowHints(false);
    localStorage.setItem('feature-hints-seen', 'true');
  };

  const nextHint = () => {
    if (currentHint < hints.length - 1) {
      setCurrentHint(currentHint + 1);
    } else {
      dismissHints();
    }
  };

  if (!showHints) return null;

  const hint = hints[currentHint];

  return (
    <div className={`fixed ${hint.position} z-40 max-w-xs`}>
      <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg relative">
        <button
          onClick={dismissHints}
          className="absolute top-2 right-2 text-blue-200 hover:text-white"
        >
          ×
        </button>
        
        <h4 className="font-medium mb-2">{hint.title}</h4>
        <p className="text-sm text-blue-100 mb-3">{hint.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {hints.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentHint ? 'bg-white' : 'bg-blue-400'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={nextHint}
            className="text-sm bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded transition-colors"
          >
            {currentHint < hints.length - 1 ? 'Next' : 'Got it'}
          </button>
        </div>
        
        {/* Arrow pointer */}
        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-blue-600 transform rotate-45"></div>
      </div>
    </div>
  );
};

export default EnhancedApp;