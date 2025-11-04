import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
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
        external: ['postgres', 'fs', 'os', 'net', 'tls', 'crypto', 'stream', 'perf_hooks'],
        output: {
          manualChunks: (id) => {
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

            // Performance and monitoring
            if (
              id.includes('frontendPerformanceService') ||
              id.includes('databasePerformanceService') ||
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

            // Database services
            if (
              id.includes('neonService') ||
              id.includes('databaseService') ||
              id.includes('databaseConnectionManager')
            ) {
              return 'database-services';
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
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID || ''),
      'process.env.GOOGLE_API_KEY': JSON.stringify(env.GOOGLE_API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.VITE_NEON_DATABASE_URL': JSON.stringify(env.VITE_NEON_DATABASE_URL || ''),
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL || ''),
      'process.env.VITE_STACK_PROJECT_ID': JSON.stringify(env.VITE_STACK_PROJECT_ID || ''),
      'process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY': JSON.stringify(
        env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || ''
      ),
      'process.env.STACK_SECRET_SERVER_KEY': JSON.stringify(env.STACK_SECRET_SERVER_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
