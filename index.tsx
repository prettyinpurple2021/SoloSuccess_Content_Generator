
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
  dsn: "https://f9f127c56f81953217dd8571584f1f80@o4509278644011008.ingest.us.sentry.io/4510191856254976",
  sendDefaultPii: true,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Clear any existing content to prevent React root conflicts
rootElement.innerHTML = '';

// Debug environment variables
console.log('Environment check:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HolographicThemeProvider>
        <AppRouter />
      </HolographicThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
