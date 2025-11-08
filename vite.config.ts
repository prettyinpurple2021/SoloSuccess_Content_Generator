import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to exclude server-only modules from client bundle
const excludeServerModules = () => {
  return {
    name: 'exclude-server-modules',
    resolveId(id: string) {
      // Create virtual stubs for server-only modules to prevent client-side imports
      // Check for both relative paths and absolute URL paths
      const isServerOnlyModule =
        id === 'postgres' ||
        id.includes('services/neonService') ||
        id.includes('services/databaseService') ||
        id.includes('services/databaseConnectionManager') ||
        id.includes('services/databasePerformanceService') ||
        id.includes('services/databaseMigrationService') ||
        id.includes('services/enhancedDatabaseService') ||
        id.includes('services/redisService') ||
        id.startsWith('/services/databaseService') ||
        id.startsWith('/services/neonService') ||
        id.startsWith('/services/redisService');

      if (isServerOnlyModule) {
        // Return a virtual module that throws an error if imported client-side
        return {
          id: `\0virtual:${id}`,
          moduleSideEffects: false,
        };
      }
      return null;
    },
    load(id: string) {
      // Provide stub implementations for server-only modules
      if (id.startsWith('\0virtual:')) {
        const originalId = id.replace('\0virtual:', '');
        if (
          originalId === 'postgres' ||
          originalId.includes('services/neonService') ||
          originalId.includes('services/databaseService') ||
          originalId.includes('services/databaseConnectionManager') ||
          originalId.includes('services/databasePerformanceService') ||
          originalId.includes('services/databaseMigrationService') ||
          originalId.includes('services/enhancedDatabaseService') ||
          originalId.includes('services/redisService') ||
          originalId.startsWith('/services/databaseService') ||
          originalId.startsWith('/services/neonService') ||
          originalId.startsWith('/services/redisService')
        ) {
          // Return a stub that exports empty objects/functions to prevent runtime errors
          // This allows the code to compile but will fail gracefully if actually called
          return `
            // Server-only module stub - this should never be called in client-side code
            const error = () => {
              throw new Error(
                '${originalId} is a server-only module and cannot be used in client-side code. ' +
                'Please use the API endpoints instead (e.g., /api/*) or clientApiService.'
              );
            };
            
            // Export common patterns that might be imported
            export const db = new Proxy({}, {
              get: () => error,
              set: () => { throw error(); },
            });
            
            export const query = error;
            export const auth = { getUser: error, isAuthenticated: error };
            export const pool = error;
            export const databaseService = error;
            export const enhancedDb = error;
            export const enhancedDatabaseService = error;
            export const redisService = error;
            export const RedisService = error;
            
            // Default export
            export default error;
          `;
        }
      }
      return null;
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), excludeServerModules()],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        external: (id, importer) => {
          // Only externalize Node.js built-ins - server-only modules are handled by the plugin
          if (
            [
              'fs',
              'os',
              'net',
              'tls',
              'crypto',
              'stream',
              'perf_hooks',
              'path',
              'url',
              'http',
              'https',
            ].includes(id)
          ) {
            return true;
          }
          // Don't externalize postgres or database services - let the plugin handle them with virtual stubs
          return false;
        },
        output: {
          manualChunks: (id) => {
            // Skip database services and Redis - they should be externalized
            if (
              id.includes('services/neonService') ||
              id.includes('services/databaseService') ||
              id.includes('services/databaseConnectionManager') ||
              id.includes('services/databasePerformanceService') ||
              id.includes('services/databaseMigrationService') ||
              id.includes('services/enhancedDatabaseService') ||
              id.includes('services/redisService') ||
              id.startsWith('/services/databaseService') ||
              id.startsWith('/services/neonService') ||
              id.startsWith('/services/redisService')
            ) {
              return null; // Don't include in any chunk
            }

            // Vendor chunks with better splitting
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react') || id.includes('@stackframe/stack')) {
                return 'vendor-ui';
              }
              if (id.includes('marked') || id.includes('uuid')) {
                return 'vendor-utils';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-ai';
              }
              return 'vendor';
            }

            // Performance and monitoring (client-side only)
            if (
              id.includes('frontendPerformanceService') ||
              id.includes('performanceMonitoringService')
            ) {
              return 'performance';
            }

            // Error handling components
            if (
              id.includes('ErrorBoundary') ||
              id.includes('LoadingStateManager') ||
              id.includes('NotificationSystem') ||
              id.includes('UserFeedbackSystem') ||
              id.includes('ErrorReportingSystem') ||
              id.includes('useErrorRecovery') ||
              id.includes('useErrorState') ||
              id.includes('errorUtils') ||
              id.includes('errorHandlingService')
            ) {
              return 'error-handling';
            }

            // AI services
            if (id.includes('geminiService') || id.includes('aiLearningService')) {
              return 'ai-services';
            }

            // Heavy components
            if (
              id.includes('IntegrationManager') ||
              id.includes('RepurposingWorkflow') ||
              id.includes('AnalyticsDashboard') ||
              id.includes('PerformanceInsights') ||
              id.includes('DragDropContentBuilder')
            ) {
              return 'components-heavy';
            }

            // Lazy components
            if (id.includes('LazyComponents')) {
              return 'lazy-components';
            }
          },
          // Optimize chunk sizes
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
              : 'chunk';
            return `assets/js/[name]-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext || '')) {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
      // Performance optimizations
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react', '@stackframe/stack'],
      exclude: [
        '@google/genai', // Large AI library - load on demand
      ],
    },
    // Performance improvements
    esbuild: {
      target: 'es2020',
      drop: ['console', 'debugger'],
    },
    define: {
      // Only expose client-safe environment variables
      // Server-side secrets should NEVER be exposed to the client
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID || ''),
      'process.env.VITE_STACK_PROJECT_ID': JSON.stringify(env.VITE_STACK_PROJECT_ID || ''),
      'process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY': JSON.stringify(
        env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || ''
      ),
      // Note: API keys, database URLs, and secret keys should NOT be exposed to client
      // They should only be used server-side in API routes
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
