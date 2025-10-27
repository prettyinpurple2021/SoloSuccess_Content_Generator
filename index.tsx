import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/holographic-theme.css';
import { HolographicThemeProvider } from './components/HolographicTheme';
import AppRouter from './AppRouter';
import * as Sentry from '@sentry/react';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-4">Please check the console for details</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-300"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
      <ErrorBoundary>
        <HolographicThemeProvider>
          <AppRouter />
        </HolographicThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; text-align: center; padding: 2rem;">
      <div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">App Failed to Load</h1>
        <p style="margin-bottom: 1rem;">Check the console for error details</p>
        <button onclick="window.location.reload()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
