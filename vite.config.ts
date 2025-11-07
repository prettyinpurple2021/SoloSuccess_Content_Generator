import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to exclude server-only modules from client bundle
const excludeServerModules = () => {
  return {
    name: 'exclude-server-modules',
    resolveId(id: string) {
      // Exclude database services and postgres from client bundle
      if (
        id === 'postgres' ||
        id.includes('services/neonService') ||
        id.includes('services/databaseService') ||
        id.includes('services/databaseConnectionManager') ||
        id.includes('services/databasePerformanceService') ||
        id.includes('services/databaseMigrationService') ||
        id.includes('services/enhancedDatabaseService')
      ) {
        return { id, external: true };
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
          // Externalize Node.js built-ins and server-only modules
          if (
            id === 'postgres' ||
            ['fs', 'os', 'net', 'tls', 'crypto', 'stream', 'perf_hooks'].includes(id)
          ) {
            return true;
          }
          // Externalize database services that should only run server-side
          // Check both the id and the importer path
          const checkPath = id || importer || '';
          if (
            checkPath.includes('neonService') ||
            checkPath.includes('databaseService') ||
            checkPath.includes('databaseConnectionManager') ||
            checkPath.includes('databasePerformanceService') ||
            checkPath.includes('databaseMigrationService') ||
            checkPath.includes('enhancedDatabaseService')
          ) {
            return true;
          }
          return false;
        },
        output: {
          manualChunks: (id) => {
            // Skip database services - they should be externalized
            if (
              id.includes('services/neonService') ||
              id.includes('services/databaseService') ||
              id.includes('services/databaseConnectionManager') ||
              id.includes('services/databasePerformanceService') ||
              id.includes('services/databaseMigrationService') ||
              id.includes('services/enhancedDatabaseService')
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
