import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, Database, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { contentCache } from '../services/cachingService';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTimes: { [key: string]: number };
  cacheHitRate: number;
  memoryUsage: number;
  errorCount: number;
  lastUpdated: Date;
}

interface PerformanceMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible,
  onToggle
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTimes: {},
    cacheHitRate: 0,
    memoryUsage: 0,
    errorCount: 0,
    lastUpdated: new Date()
  });

  const [isRecording, setIsRecording] = useState(false);

  // Performance observer for measuring page load times
  useEffect(() => {
    if ('performance' in window && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            setMetrics(prev => ({
              ...prev,
              pageLoadTime: navEntry.loadEventEnd - navEntry.navigationStart,
              lastUpdated: new Date()
            }));
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  // Monitor API response times
  const recordApiCall = useCallback((endpoint: string, duration: number) => {
    setMetrics(prev => ({
      ...prev,
      apiResponseTimes: {
        ...prev.apiResponseTimes,
        [endpoint]: duration
      },
      lastUpdated: new Date()
    }));
  }, []);

  // Update cache metrics
  useEffect(() => {
    const updateCacheMetrics = () => {
      const cacheStats = contentCache.getStats();
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: cacheStats.hitRate,
        lastUpdated: new Date()
      }));
    };

    const interval = setInterval(updateCacheMetrics, 5000); // Update every 5 seconds
    updateCacheMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Monitor memory usage (if available)
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: usagePercent,
          lastUpdated: new Date()
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 10000); // Update every 10 seconds
    updateMemoryUsage(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Monitor errors
  useEffect(() => {
    const handleError = () => {
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        lastUpdated: new Date()
      }));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const getPerformanceStatus = () => {
    const avgApiTime = Object.values(metrics.apiResponseTimes).reduce((sum, time) => sum + time, 0) / 
                      Object.values(metrics.apiResponseTimes).length || 0;

    if (avgApiTime > 2000 || metrics.memoryUsage > 80 || metrics.errorCount > 5) {
      return { status: 'poor', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (avgApiTime > 1000 || metrics.memoryUsage > 60 || metrics.errorCount > 2) {
      return { status: 'fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    } else {
      return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
  };

  const performanceStatus = getPerformanceStatus();

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className={`fixed bottom-20 right-6 w-12 h-12 ${performanceStatus.bgColor} ${performanceStatus.color} rounded-full shadow-lg hover:shadow-xl transition-all z-30 flex items-center justify-center`}
        title="Performance Monitor"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-20 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Performance</h3>
          <div className={`w-2 h-2 rounded-full ${
            performanceStatus.status === 'good' ? 'bg-green-500' :
            performanceStatus.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-4">
        {/* Page Load Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">Page Load</span>
          </div>
          <span className="text-sm font-medium">
            {metrics.pageLoadTime > 0 ? `${Math.round(metrics.pageLoadTime)}ms` : 'N/A'}
          </span>
        </div>

        {/* Cache Hit Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Cache Hit Rate</span>
          </div>
          <span className="text-sm font-medium">
            {metrics.cacheHitRate.toFixed(1)}%
          </span>
        </div>

        {/* Memory Usage */}
        {metrics.memoryUsage > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">Memory Usage</span>
            </div>
            <span className="text-sm font-medium">
              {metrics.memoryUsage.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Error Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">Errors</span>
          </div>
          <span className="text-sm font-medium">
            {metrics.errorCount}
          </span>
        </div>

        {/* API Response Times */}
        {Object.keys(metrics.apiResponseTimes).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">API Response Times</h4>
            <div className="space-y-1">
              {Object.entries(metrics.apiResponseTimes).slice(-3).map(([endpoint, time]) => (
                <div key={endpoint} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 truncate">{endpoint}</span>
                  <span className={`font-medium ${
                    time > 2000 ? 'text-red-600' : 
                    time > 1000 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {Math.round(time)}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Status */}
        <div className={`p-3 rounded-lg ${performanceStatus.bgColor}`}>
          <div className="flex items-center gap-2">
            {performanceStatus.status === 'good' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
            <span className={`text-sm font-medium ${performanceStatus.color}`}>
              Performance: {performanceStatus.status.charAt(0).toUpperCase() + performanceStatus.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-400 text-center">
          Last updated: {metrics.lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <button
            onClick={() => {
              contentCache.clear();
              setMetrics(prev => ({ ...prev, errorCount: 0 }));
            }}
            className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Clear Cache
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-3 py-2 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const recordApiCall = useCallback((endpoint: string, startTime: number) => {
    const duration = Date.now() - startTime;
    // This would be used to record API call performance
    console.log(`API Call: ${endpoint} took ${duration}ms`);
  }, []);

  return {
    isVisible,
    toggle,
    recordApiCall
  };
};

export default PerformanceMonitor;