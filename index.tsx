
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/holographic-theme.css';
import { HolographicThemeProvider } from './components/HolographicTheme';
import AppRouter from './AppRouter';
import * as Sentry from '@sentry/react';

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

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HolographicThemeProvider>
      <AppRouter />
    </HolographicThemeProvider>
  </React.StrictMode>
);
