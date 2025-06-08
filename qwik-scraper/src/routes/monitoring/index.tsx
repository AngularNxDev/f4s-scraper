import { component$, useSignal, useStore, useVisibleTask$, $ } from '@builder.io/qwik';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  service: string;
  message: string;
  details?: any;
}

interface ServiceStatus {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: string;
  responseTime?: number;
}

export default component$(() => {
  const logs = useSignal<LogEntry[]>([
    {
      timestamp: new Date().toISOString(),
      level: 'success',
      service: 'Content Scraper',
      message: 'Successfully scraped MyLife Clubs sitemap',
      details: { url: 'https://www.mylife.nl/sitemaps.xml', contentLength: 17186 }
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'error',
      service: 'Database',
      message: 'Content hash constraint violation fixed',
      details: { error: 'null value in column "content_hash"', status: 'resolved' }
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: 'info',
      service: 'MCP Bridge',
      message: 'AI analysis request processed with fallback',
      details: { mastraStatus: 'unavailable', fallbackUsed: true }
    },
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      level: 'warning',
      service: 'Mastra Agents',
      message: 'Connection refused - service may be down',
      details: { port: 4111, retryAttempts: 3 }
    }
  ]);

  const services = useStore<ServiceStatus[]>([
    { name: 'NestJS API', url: 'http://localhost:3000', status: 'healthy', lastCheck: new Date().toISOString(), responseTime: 45 },
    { name: 'MCP Bridge', url: 'http://localhost:8081', status: 'healthy', lastCheck: new Date().toISOString(), responseTime: 23 },
    { name: 'Mastra Agents', url: 'http://localhost:4111', status: 'unhealthy', lastCheck: new Date().toISOString() },
    { name: 'Qwik Frontend', url: 'http://localhost:5174', status: 'healthy', lastCheck: new Date().toISOString(), responseTime: 12 }
  ]);

  const stats = useStore({
    totalRequests: 147,
    successfulRequests: 134,
    failedRequests: 13,
    avgResponseTime: 156,
    activeUrls: 3,
    scrapedToday: 8,
    changesDetected: 2,
    aiAnalysisCount: 5
  });

  const autoRefresh = useSignal(true);
  const refreshInterval = useSignal(5000);

  // Add new log entry
  const addLog = $((entry: Omit<LogEntry, 'timestamp'>) => {
    logs.value = [
      { ...entry, timestamp: new Date().toISOString() },
      ...logs.value.slice(0, 49) // Keep only last 50 logs
    ];
  });

  // Simulate service checks
  const checkServices = $(async () => {
    for (const service of services) {
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(service.url.includes('health') ? service.url : `${service.url}/health`, {
          signal: controller.signal,
          mode: 'no-cors' // For testing cross-origin requests
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        service.status = 'healthy';
        service.responseTime = responseTime;
        service.lastCheck = new Date().toISOString();
      } catch (error) {
        service.status = 'unhealthy';
        service.responseTime = undefined;
        service.lastCheck = new Date().toISOString();
      }
    }
  });

  // Simulate real-time activity
  useVisibleTask$(() => {
    const activities = [
      { level: 'info' as const, service: 'URL Discovery', message: 'Scanning for new location pages' },
      { level: 'success' as const, service: 'Content Scraper', message: 'Content successfully scraped and processed' },
      { level: 'info' as const, service: 'AI Analysis', message: 'Analyzing content for location changes' },
      { level: 'warning' as const, service: 'Database', message: 'High query load detected' },
      { level: 'success' as const, service: 'Change Detection', message: 'New location information found' }
    ];

    let activityIndex = 0;
    const activityInterval = setInterval(() => {
      if (autoRefresh.value) {
        const activity = activities[activityIndex % activities.length];
        addLog(activity);
        activityIndex++;
        
        // Update stats occasionally
        if (Math.random() > 0.7) {
          stats.totalRequests++;
          if (Math.random() > 0.1) {
            stats.successfulRequests++;
          } else {
            stats.failedRequests++;
          }
        }
      }
    }, refreshInterval.value);

    // Check services periodically
    const serviceInterval = setInterval(() => {
      if (autoRefresh.value) {
        checkServices();
      }
    }, 10000);

    return () => {
      clearInterval(activityInterval);
      clearInterval(serviceInterval);
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  return (
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        {/* Header */}
        <div class="mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">System Monitoring</h1>
              <p class="text-gray-600 mt-2">Real-time system activity and service health</p>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh.value}
                  onChange$={(e) => autoRefresh.value = (e.target as HTMLInputElement).checked}
                  class="rounded border-gray-300 text-blue-600"
                />
                <label for="autoRefresh" class="text-sm text-gray-700">Auto-refresh</label>
              </div>
              <select
                value={refreshInterval.value}
                onChange$={(e) => refreshInterval.value = parseInt((e.target as HTMLSelectElement).value)}
                class="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <h3 class="text-xs font-medium text-gray-500">Total Requests</h3>
            <p class="text-xl font-bold text-gray-900 mt-1">{stats.totalRequests}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <h3 class="text-xs font-medium text-gray-500">Successful</h3>
            <p class="text-xl font-bold text-green-600 mt-1">{stats.successfulRequests}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <h3 class="text-xs font-medium text-gray-500">Failed</h3>
            <p class="text-xl font-bold text-red-600 mt-1">{stats.failedRequests}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <h3 class="text-xs font-medium text-gray-500">Avg Response</h3>
            <p class="text-xl font-bold text-gray-900 mt-1">{stats.avgResponseTime}ms</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <h3 class="text-xs font-medium text-gray-500">Active URLs</h3>
            <p class="text-xl font-bold text-blue-600 mt-1">{stats.activeUrls}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <h3 class="text-xs font-medium text-gray-500">Scraped Today</h3>
            <p class="text-xl font-bold text-purple-600 mt-1">{stats.scrapedToday}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <h3 class="text-xs font-medium text-gray-500">Changes Found</h3>
            <p class="text-xl font-bold text-orange-600 mt-1">{stats.changesDetected}</p>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <h3 class="text-xs font-medium text-gray-500">AI Analysis</h3>
            <p class="text-xl font-bold text-indigo-600 mt-1">{stats.aiAnalysisCount}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Status */}
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Service Health</h2>
              <div class="space-y-4">
                {services.map((service) => (
                  <div key={service.name} class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 class="font-medium text-gray-900">{service.name}</h3>
                      <p class="text-sm text-gray-600">{service.url}</p>
                      <p class="text-xs text-gray-500">
                        Last check: {new Date(service.lastCheck).toLocaleTimeString()}
                      </p>
                    </div>
                    <div class="text-right">
                      <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                      {service.responseTime && (
                        <p class="text-xs text-gray-500 mt-1">{service.responseTime}ms</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Activity Logs */}
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Live Activity Feed</h2>
              <div class="space-y-3 max-h-96 overflow-y-auto">
                {logs.value.map((log, index) => (
                  <div key={index} class={`border-l-4 pl-4 py-2 ${getLevelColor(log.level)}`}>
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2">
                          <span class="text-sm">{getLevelIcon(log.level)}</span>
                          <span class="text-sm font-medium text-gray-900">{log.service}</span>
                          <span class="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p class="text-sm text-gray-700 mt-1">{log.message}</p>
                        {log.details && (
                          <pre class="text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Manual Controls */}
        <div class="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Manual Controls</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick$={() => {
                addLog({
                  level: 'info',
                  service: 'Manual Trigger',
                  message: 'URL discovery initiated by user',
                  details: { action: 'url_discovery', user: 'admin' }
                });
              }}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 Trigger URL Discovery
            </button>
            <button
              onClick$={() => {
                addLog({
                  level: 'info',
                  service: 'Manual Trigger',
                  message: 'Content scraping initiated by user',
                  details: { action: 'content_scraping', user: 'admin' }
                });
              }}
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🕷️ Trigger Scraping
            </button>
            <button
              onClick$={() => {
                addLog({
                  level: 'info',
                  service: 'Manual Trigger',
                  message: 'AI analysis test initiated by user',
                  details: { action: 'ai_test', user: 'admin' }
                });
              }}
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🤖 Test AI Analysis
            </button>
            <button
              onClick$={() => {
                checkServices();
                addLog({
                  level: 'info',
                  service: 'Manual Trigger',
                  message: 'Service health check initiated by user',
                  details: { action: 'health_check', user: 'admin' }
                });
              }}
              class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              🏥 Check Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}); 