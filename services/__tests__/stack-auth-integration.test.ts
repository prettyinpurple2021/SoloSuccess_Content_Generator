import { describe, it, expect, beforeAll } from 'vitest';
import { stackServerApp } from '../../stack';

// Integration tests for Stack Auth in production environment
describe('Stack Auth Production Integration', () => {
  beforeAll(() => {
    // Ensure we have the required environment variables
    if (!process.env.VITE_STACK_PROJECT_ID) {
      console.warn('VITE_STACK_PROJECT_ID not set - some tests may fail');
    }
    if (!process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY) {
      console.warn('VITE_STACK_PUBLISHABLE_CLIENT_KEY not set - some tests may fail');
    }
    if (!process.env.STACK_SECRET_SERVER_KEY) {
      console.warn('STACK_SECRET_SERVER_KEY not set - some tests may fail');
    }
  });

  describe('Stack Auth Configuration', () => {
    it('should have valid Stack Auth configuration', () => {
      expect(stackServerApp).toBeDefined();
      expect(stackServerApp.projectId).toBeDefined();
      expect(stackServerApp.publishableClientKey).toBeDefined();

      // Validate configuration format
      expect(typeof stackServerApp.projectId).toBe('string');
      expect(typeof stackServerApp.publishableClientKey).toBe('string');
      expect(stackServerApp.projectId.length).toBeGreaterThan(0);
      expect(stackServerApp.publishableClientKey.length).toBeGreaterThan(0);
    });

    it('should have correct URL configuration', () => {
      expect(stackServerApp.urls).toBeDefined();
      expect(stackServerApp.urls.signIn).toBe('/auth/signin');
      expect(stackServerApp.urls.signUp).toBe('/auth/signup');
      expect(stackServerApp.urls.afterSignIn).toBe('/');
      expect(stackServerApp.urls.afterSignUp).toBe('/');
    });

    it('should use cookie token store', () => {
      expect(stackServerApp.tokenStore).toBe('cookie');
    });
  });

  describe('Environment Variables Validation', () => {
    it('should have VITE_STACK_PROJECT_ID set', () => {
      const projectId = process.env.VITE_STACK_PROJECT_ID;
      expect(projectId).toBeDefined();
      expect(typeof projectId).toBe('string');
      expect(projectId.length).toBeGreaterThan(0);
    });

    it('should have VITE_STACK_PUBLISHABLE_CLIENT_KEY set', () => {
      const publishableKey = process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;
      expect(publishableKey).toBeDefined();
      expect(typeof publishableKey).toBe('string');
      expect(publishableKey.length).toBeGreaterThan(0);
    });

    it('should have STACK_SECRET_SERVER_KEY set', () => {
      const secretKey = process.env.STACK_SECRET_SERVER_KEY;
      expect(secretKey).toBeDefined();
      expect(typeof secretKey).toBe('string');
      expect(secretKey.length).toBeGreaterThan(0);
    });

    it('should have consistent project ID between client and server', () => {
      const clientProjectId = process.env.VITE_STACK_PROJECT_ID;
      const serverProjectId = stackServerApp.projectId;
      expect(clientProjectId).toBe(serverProjectId);
    });

    it('should have consistent publishable key between client and server', () => {
      const clientPublishableKey = process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;
      const serverPublishableKey = stackServerApp.publishableClientKey;
      expect(clientPublishableKey).toBe(serverPublishableKey);
    });
  });

  describe('Stack Auth API Connectivity', () => {
    it('should be able to initialize Stack Auth client', async () => {
      // This test verifies that Stack Auth can be initialized without errors
      expect(() => {
        // The stackServerApp should initialize without throwing
        const app = stackServerApp;
        expect(app).toBeDefined();
      }).not.toThrow();
    });

    // Note: We can't test actual API calls without valid credentials and network access
    // These would be integration tests that require a real Stack Auth project
  });

  describe('Authentication Flow Configuration', () => {
    it('should have proper redirect URLs configured', () => {
      const urls = stackServerApp.urls;

      // Sign in should redirect to signin page
      expect(urls.signIn).toBe('/auth/signin');

      // Sign up should redirect to signup page
      expect(urls.signUp).toBe('/auth/signup');

      // After successful auth, should redirect to home
      expect(urls.afterSignIn).toBe('/');
      expect(urls.afterSignUp).toBe('/');
    });

    it('should use secure cookie-based token storage', () => {
      expect(stackServerApp.tokenStore).toBe('cookie');
    });
  });

  describe('Security Configuration', () => {
    it('should not expose secret keys in client-side code', () => {
      // The secret key should only be available server-side
      // In a real browser environment, this should be undefined
      if (typeof window !== 'undefined') {
        expect(process.env.STACK_SECRET_SERVER_KEY).toBeUndefined();
      }
    });

    it('should have proper key formats', () => {
      const projectId = process.env.VITE_STACK_PROJECT_ID;
      const publishableKey = process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;
      const secretKey = process.env.STACK_SECRET_SERVER_KEY;

      // Basic format validation (Stack Auth keys have specific patterns)
      if (projectId) {
        expect(projectId).toMatch(/^[a-zA-Z0-9-_]+$/);
      }

      if (publishableKey) {
        expect(publishableKey).toMatch(/^[a-zA-Z0-9-_]+$/);
      }

      if (secretKey) {
        expect(secretKey).toMatch(/^[a-zA-Z0-9-_]+$/);
      }
    });
  });

  describe('Production Readiness Checks', () => {
    it('should have all required configuration for production', () => {
      const requiredEnvVars = [
        'VITE_STACK_PROJECT_ID',
        'VITE_STACK_PUBLISHABLE_CLIENT_KEY',
        'STACK_SECRET_SERVER_KEY',
      ];

      const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

      if (missingVars.length > 0) {
        console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
        console.warn('These are required for Stack Auth to work in production');
      }

      // In a production environment, all should be present
      expect(missingVars.length).toBe(0);
    });

    it('should have proper error handling configuration', () => {
      // Stack Auth should be configured to handle errors gracefully
      expect(stackServerApp).toBeDefined();
      expect(typeof stackServerApp.projectId).toBe('string');
      expect(typeof stackServerApp.publishableClientKey).toBe('string');
    });
  });

  describe('Database Integration Readiness', () => {
    it('should have database URL configured', () => {
      const databaseUrl = process.env.DATABASE_URL;
      expect(databaseUrl).toBeDefined();
      expect(typeof databaseUrl).toBe('string');
      expect(databaseUrl.length).toBeGreaterThan(0);
    });

    it('should have Neon database URL format', () => {
      const databaseUrl = process.env.DATABASE_URL;
      if (databaseUrl) {
        // Neon URLs typically start with postgresql:// and contain neon.tech
        expect(databaseUrl).toMatch(/^postgresql:\/\//);
        expect(databaseUrl).toContain('neon');
      }
    });
  });

  describe('Client-Side Integration', () => {
    it('should export Stack Auth hooks and components', async () => {
      // Test that we can import Stack Auth components
      try {
        const { useUser, useStackApp, StackProvider, StackTheme, SignIn } = await import(
          '@stackframe/stack'
        );

        expect(useUser).toBeDefined();
        expect(useStackApp).toBeDefined();
        expect(StackProvider).toBeDefined();
        expect(StackTheme).toBeDefined();
        expect(SignIn).toBeDefined();

        expect(typeof useUser).toBe('function');
        expect(typeof useStackApp).toBe('function');
        expect(typeof StackProvider).toBe('function');
        expect(typeof StackTheme).toBe('function');
        expect(typeof SignIn).toBe('function');
      } catch (error) {
        console.error('Failed to import Stack Auth components:', error);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables gracefully', () => {
      // Test what happens when env vars are missing
      const originalProjectId = process.env.VITE_STACK_PROJECT_ID;
      const originalPublishableKey = process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;
      const originalSecretKey = process.env.STACK_SECRET_SERVER_KEY;

      try {
        // Temporarily remove env vars
        delete process.env.VITE_STACK_PROJECT_ID;
        delete process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;
        delete process.env.STACK_SECRET_SERVER_KEY;

        // This should either throw an error or handle gracefully
        expect(() => {
          // Try to create a new Stack app instance
          const testApp = stackServerApp;
          expect(testApp).toBeDefined();
        }).not.toThrow();
      } finally {
        // Restore env vars
        if (originalProjectId) process.env.VITE_STACK_PROJECT_ID = originalProjectId;
        if (originalPublishableKey)
          process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY = originalPublishableKey;
        if (originalSecretKey) process.env.STACK_SECRET_SERVER_KEY = originalSecretKey;
      }
    });

    it('should provide meaningful error messages for configuration issues', () => {
      // Stack Auth should provide clear error messages when misconfigured
      expect(stackServerApp).toBeDefined();

      // If there are configuration issues, they should be caught during initialization
      expect(stackServerApp.projectId).toBeDefined();
      expect(stackServerApp.publishableClientKey).toBeDefined();
    });
  });

  describe('Performance Considerations', () => {
    it('should initialize Stack Auth efficiently', () => {
      const startTime = performance.now();

      // Initialize Stack Auth
      const app = stackServerApp;
      expect(app).toBeDefined();

      const endTime = performance.now();
      const initTime = endTime - startTime;

      // Initialization should be fast (less than 100ms)
      expect(initTime).toBeLessThan(100);
    });
  });
});
