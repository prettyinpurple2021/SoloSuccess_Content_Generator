// Ensure React is loaded first by importing it here
import 'react';

import { StackClientApp } from '@stackframe/react';

// Initialize StackClientApp - React should be available now
export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID!,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY!,
  tokenStore: 'cookie',
  // redirectMethod is not needed when using BrowserRouter - Stack Auth handles navigation automatically
});
