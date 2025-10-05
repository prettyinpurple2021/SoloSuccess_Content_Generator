
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import { HolographicThemeProvider } from './components/HolographicTheme';
import AppRouter from './AppRouter';

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
