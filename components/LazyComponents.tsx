import { lazy } from 'react';

// Lazy load heavy components for code splitting
export const LazyErrorReportingSystem = lazy(() => import('./ErrorReportingSystem'));
export const LazyEnhancedErrorExample = lazy(() => import('./EnhancedErrorExample'));
export const LazyIntegrationManager = lazy(() => import('./IntegrationManager'));
export const LazyRepurposingWorkflow = lazy(() => import('./RepurposingWorkflow'));
export const LazyImageStyleManager = lazy(() => import('./ImageStyleManager'));
export const LazyContentSeriesManager = lazy(() => import('./ContentSeriesManager'));
export const LazyTemplateLibrary = lazy(() => import('./TemplateLibrary'));
export const LazyAnalyticsDashboard = lazy(() =>
  import('./AnalyticsDashboard').then((module) => ({ default: module.AnalyticsDashboard }))
);
export const LazyPerformanceInsights = lazy(() =>
  import('./PerformanceInsights').then((module) => ({ default: module.PerformanceInsights }))
);
export const LazyDragDropContentBuilder = lazy(() => import('./DragDropContentBuilder'));
export const LazyVoiceCommands = lazy(() => import('./VoiceCommands'));
export const LazyGamificationSystem = lazy(() => import('./GamificationSystem'));

// Lazy load service modules
export const LazyGeminiService = lazy(() => import('../services/geminiService'));
export const LazyBloggerService = lazy(() => import('../services/bloggerService'));

// Loading fallback component
export const ComponentLoadingFallback: React.FC<{ name?: string }> = ({ name }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-600">Loading {name || 'component'}...</p>
    </div>
  </div>
);

// Error fallback for lazy components
export const ComponentErrorFallback: React.FC<{
  error?: Error;
  retry?: () => void;
  componentName?: string;
}> = ({ error, retry, componentName }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
        <span className="text-white text-sm">!</span>
      </div>
      <h3 className="font-medium text-red-900">Failed to load {componentName || 'component'}</h3>
    </div>

    <p className="text-sm text-red-700 mb-4">
      {error?.message || 'The component could not be loaded. This might be due to a network issue.'}
    </p>

    {retry && (
      <button
        onClick={retry}
        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

export default {
  LazyErrorReportingSystem,
  LazyEnhancedErrorExample,
  LazyIntegrationManager,
  LazyRepurposingWorkflow,
  LazyImageStyleManager,
  LazyContentSeriesManager,
  LazyTemplateLibrary,
  LazyAnalyticsDashboard,
  LazyPerformanceInsights,
  LazyDragDropContentBuilder,
  LazyVoiceCommands,
  LazyGamificationSystem,
  ComponentLoadingFallback,
  ComponentErrorFallback,
};
