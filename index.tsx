import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/holographic-theme.css';
import { HolographicThemeProvider } from './components/HolographicTheme';
import AppWithErrorHandling from './components/AppWithErrorHandling';
import { ErrorBoundaryEnhanced } from './components/ErrorBoundaryEnhanced';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://f9f127c56f81953217dd8571584f1f80@o4509278644011008.ingest.us.sentry.io/4510191856254976',
  sendDefaultPii: true,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// Clear any existing content to prevent React root conflicts
rootElement.innerHTML = '';

// Debug environment variables
console.log('Environment check:', {
  VITE_STACK_PROJECT_ID: import.meta.env.VITE_STACK_PROJECT_ID ? 'Present' : 'Missing',
  VITE_STACK_PUBLISHABLE_CLIENT_KEY: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY
    ? 'Present'
    : 'Missing',
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
});

// Additional debug info
console.log('Full environment:', import.meta.env);
console.log('Stack config check:', {
  projectId: import.meta.env.VITE_STACK_PROJECT_ID,
  publishableKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  secretKey: import.meta.env.STACK_SECRET_SERVER_KEY ? 'Present' : 'Missing',
});

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundaryEnhanced
        level="page"
        allowRetry={true}
        allowReload={true}
        allowReport={true}
        onError={(error, errorInfo) => {
          console.error('Root level error:', error, errorInfo);
          Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          });
        }}
      >
        <HolographicThemeProvider>
          <AppWithErrorHandling />
        </HolographicThemeProvider>
      </ErrorBoundaryEnhanced>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  Sentry.captureException(error);
  rootElement.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; text-align: center; padding: 2rem;">
      <div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">App Failed to Load 💀</h1>
        <p style="margin-bottom: 1rem;">A critical error occurred during app initialization. Check the console for details.</p>
        <div style="margin-bottom: 1rem;">
          <button onclick="window.location.reload()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; margin-right: 0.5rem;">
            Reload Page 🔄
          </button>
          <button onclick="navigator.clipboard.writeText('${error?.toString().replace(/'/g, "\\'")}').then(() => alert('Error copied to clipboard!'))" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">
            Copy Error 📋
          </button>
        </div>
        <p style="font-size: 0.875rem; opacity: 0.8;">Error ID: ${Date.now()}</p>
      </div>
    </div>
  `;
}
