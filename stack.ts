import { StackServerApp } from '@stackframe/stack';

export const stackServerApp = new StackServerApp({
  tokenStore: 'cookie',
  urls: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    afterSignIn: '/',
    afterSignUp: '/',
  },
  projectId: import.meta.env.VITE_STACK_PROJECT_ID!,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY!,
  secretServerKey: import.meta.env.STACK_SECRET_SERVER_KEY!,
});
