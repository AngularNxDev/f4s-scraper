import { component$, useStore, useTask$, $ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { supabase } from '../lib/supabase';
import type { BaseUrl, DiscoveredUrl, ScrapingJob, ContentChange } from '../lib/supabase';

export const useDashboardLoader = routeLoader$(async () => {
  try {
    // Fetch dashboard data
    const [baseUrlsResult, discoveredUrlsResult, jobsResult, changesResult] = await Promise.all([
      supabase.from('base_urls').select('*').limit(5),
      supabase.from('discovered_urls').select('*').limit(10),
      supabase.from('scraping_jobs').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('content_changes').select('*').order('detected_at', { ascending: false }).limit(5),
    ]);

    return {
      baseUrls: baseUrlsResult.data || [],
      discoveredUrls: discoveredUrlsResult.data || [],
      recentJobs: jobsResult.data || [],
      recentChanges: changesResult.data || [],
      error: baseUrlsResult.error || discoveredUrlsResult.error || jobsResult.error || changesResult.error,
    };
  } catch (error) {
    console.error('Dashboard loading error:', error);
    return {
      baseUrls: [],
      discoveredUrls: [],
      recentJobs: [],
      recentChanges: [],
      error: 'Failed to load dashboard data',
    };
  }
});

export default component$(() => {
  const dashboardData = useDashboardLoader();
  const store = useStore({
    isLoading: false,
    lastRefresh: new Date().toISOString(),
  });

  const handleRefresh = $(() => {
    store.isLoading = true;
    // In a real app, you'd trigger a refresh here
    setTimeout(() => {
      store.isLoading = false;
      store.lastRefresh = new Date().toISOString();
    }, 1000);
  });

  const triggerDiscovery = $(async () => {
    store.isLoading = true;
    try {
      // Call MCP Bridge to trigger URL discovery
      const response = await fetch('http://localhost:8081/trigger/url-discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          baseUrlId: "1" // Use first base URL for now
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('URL discovery triggered successfully:', result);
        // Optionally show success message or refresh data
      } else {
        console.error('Failed to trigger URL discovery:', response.statusText);
      }
    } catch (error) {
      console.error('Error triggering URL discovery:', error);
    } finally {
      store.isLoading = false;
    }
  });

  const triggerScraping = $(async () => {
    store.isLoading = true;
    try {
      // Call MCP Bridge to trigger content scraping
      const response = await fetch('http://localhost:8081/trigger/content-scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUrls: ["https://example.com/locations"] // Example target URL
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Content scraping triggered successfully:', result);
        // Optionally show success message or refresh data
      } else {
        console.error('Failed to trigger content scraping:', response.statusText);
      }
    } catch (error) {
      console.error('Error triggering content scraping:', error);
    } finally {
      store.isLoading = false;
    }
  });

  return (
    <div class="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="mt-2 text-sm text-gray-600">
            Monitor and control your AI-powered scraping operations
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            onClick$={handleRefresh}
            disabled={store.isLoading}
            class="btn btn-secondary"
          >
            {store.isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick$={triggerDiscovery}
            disabled={store.isLoading}
            class="btn btn-primary"
          >
            Trigger Discovery
          </button>
          <button
            onClick$={triggerScraping}
            disabled={store.isLoading}
            class="btn btn-primary"
          >
            Trigger Scraping
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="flex items-center">
            <div class="p-2 bg-primary-100 rounded-lg">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Base URLs</p>
              <p class="text-2xl font-bold text-gray-900">{dashboardData.value.baseUrls.length}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Discovered URLs</p>
              <p class="text-2xl font-bold text-gray-900">{dashboardData.value.discoveredUrls.length}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Active Jobs</p>
              <p class="text-2xl font-bold text-gray-900">
                {dashboardData.value.recentJobs.filter(job => job.status === 'running').length}
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-2 bg-red-100 rounded-lg">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Changes Detected</p>
              <p class="text-2xl font-bold text-gray-900">{dashboardData.value.recentChanges.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Recent Jobs</h3>
            <a href="/jobs" class="text-sm text-primary-600 hover:text-primary-700">
              View all
            </a>
          </div>
          <div class="space-y-3">
            {dashboardData.value.recentJobs.length === 0 ? (
              <p class="text-gray-500 text-sm">No recent jobs</p>
            ) : (
              dashboardData.value.recentJobs.map((job: ScrapingJob) => (
                <div key={job.id} class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{job.job_type}</p>
                    <p class="text-xs text-gray-500">
                      {job.created_at ? new Date(job.created_at).toLocaleString() : 'Unknown time'}
                    </p>
                  </div>
                  <span class={`px-2 py-1 text-xs rounded-full ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Changes */}
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Recent Changes</h3>
            <a href="/changes" class="text-sm text-primary-600 hover:text-primary-700">
              View all
            </a>
          </div>
          <div class="space-y-3">
            {dashboardData.value.recentChanges.length === 0 ? (
              <p class="text-gray-500 text-sm">No recent changes detected</p>
            ) : (
              dashboardData.value.recentChanges.map((change: ContentChange) => (
                <div key={change.id} class="p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center justify-between mb-1">
                    <span class={`px-2 py-1 text-xs rounded-full ${
                      change.change_type === 'new_content' ? 'bg-green-100 text-green-800' :
                      change.change_type === 'content_modified' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {change.change_type}
                    </span>
                    <span class="text-xs text-gray-500">
                      Confidence: {Math.round((change.confidence_score || 0) * 100)}%
                    </span>
                  </div>
                  <p class="text-sm text-gray-900">{change.change_summary || 'No summary available'}</p>
                  <p class="text-xs text-gray-500 mt-1">
                    {change.detected_at ? new Date(change.detected_at).toLocaleString() : 'Unknown time'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Last Refresh */}
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-500">
          Last refreshed: {new Date(store.lastRefresh).toLocaleString()}
        </p>
      </div>
    </div>
  );
});
