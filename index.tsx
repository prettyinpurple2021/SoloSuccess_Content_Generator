
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import { HolographicThemeProvider } from './components/HolographicTheme';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HolographicThemeProvider>
      <App />
    </HolographicThemeProvider>
  </React.StrictMode>
);
