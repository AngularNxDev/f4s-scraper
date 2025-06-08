import { component$, useStore, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { supabase } from '../../lib/supabase';
import type { ScrapedContent, ContentChange, DiscoveredUrl } from '../../lib/supabase';

interface ScrapedContentWithUrl extends ScrapedContent {
  discovered_urls?: DiscoveredUrl & {
    base_urls?: {
      name: string;
    };
  };
}

interface ContentChangeWithDetails extends ContentChange {
  discovered_urls?: DiscoveredUrl & {
    base_urls?: {
      name: string;
    };
  };
  previous_content?: ScrapedContent;
  current_content?: ScrapedContent;
}

export const useScrapedContentLoader = routeLoader$(async () => {
  try {
    // Fetch scraped content with URL details
    const [scrapedContentResult, contentChangesResult] = await Promise.all([
      supabase
        .from('scraped_content')
        .select(`
          *,
          discovered_urls (
            id,
            url,
            page_type,
            base_urls (
              name
            )
          )
        `)
        .order('scraped_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('content_changes')
        .select(`
          *,
          discovered_urls (
            id,
            url,
            page_type,
            base_urls (
              name
            )
          )
        `)
        .order('detected_at', { ascending: false })
        .limit(20)
    ]);

    return {
      scrapedContent: scrapedContentResult.data || [],
      contentChanges: contentChangesResult.data || [],
      error: scrapedContentResult.error || contentChangesResult.error,
    };
  } catch (error) {
    console.error('Scraped content loading error:', error);
    return {
      scrapedContent: [],
      contentChanges: [],
      error: 'Failed to load scraped content data',
    };
  }
});

export default component$(() => {
  const contentData = useScrapedContentLoader();
  const store = useStore({
    activeTab: 'scraped' as 'scraped' | 'changes',
    selectedContent: null as ScrapedContentWithUrl | null,
    showContentModal: false,
    filterStatus: 'all' as 'all' | 'success' | 'failed',
    searchQuery: '',
  });

  const filteredContent = contentData.value.scrapedContent.filter((content: ScrapedContentWithUrl) => {
    const matchesStatus = store.filterStatus === 'all' || content.scrape_status === store.filterStatus;
    const matchesSearch = !store.searchQuery || 
      content.discovered_urls?.url.toLowerCase().includes(store.searchQuery.toLowerCase()) ||
      (content.discovered_urls?.base_urls as any)?.name?.toLowerCase().includes(store.searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openContentModal = $((content: ScrapedContentWithUrl) => {
    store.selectedContent = content;
    store.showContentModal = true;
  });

  const closeContentModal = $(() => {
    store.showContentModal = false;
    store.selectedContent = null;
  });

  const formatContentPreview = (content: string | null | undefined, maxLength = 200) => {
    if (!content) return 'No content available';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'timeout': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeColor = (changeType: string | null | undefined) => {
    switch (changeType) {
      case 'new_content': return 'bg-green-100 text-green-800';
      case 'content_modified': return 'bg-blue-100 text-blue-800';
      case 'content_removed': return 'bg-red-100 text-red-800';
      case 'structure_changed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div class="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Scraped Content</h1>
          <p class="mt-2 text-sm text-gray-600">
            View and analyze content collected by your scraping agents
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            onClick$={async () => {
              try {
                const response = await fetch('http://localhost:3000/trigger/content-scraping', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ targetUrls: ['https://httpbin.org/html', 'https://httpbin.org/json'] }),
                });
                
                if (response.ok) {
                  // Refresh the page after a short delay to see new content
                  setTimeout(() => window.location.reload(), 2000);
                }
              } catch (error) {
                console.error('Error triggering scraping:', error);
              }
            }}
            class="btn btn-primary"
          >
            🕷️ Trigger Test Scraping
          </button>
          <button
            onClick$={() => window.location.reload()}
            class="btn btn-secondary"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Scraped</p>
              <p class="text-2xl font-bold text-gray-900">{contentData.value.scrapedContent.length}</p>
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
              <p class="text-sm font-medium text-gray-600">Successful</p>
              <p class="text-2xl font-bold text-gray-900">
                {contentData.value.scrapedContent.filter((c: ScrapedContentWithUrl) => c.scrape_status === 'success').length}
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
              <p class="text-sm font-medium text-gray-600">Failed</p>
              <p class="text-2xl font-bold text-gray-900">
                {contentData.value.scrapedContent.filter((c: ScrapedContentWithUrl) => c.scrape_status === 'failed').length}
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 rounded-lg">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Changes Detected</p>
              <p class="text-2xl font-bold text-gray-900">{contentData.value.contentChanges.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div class="card mb-8">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              type="text"
              placeholder="Search by URL or source..."
              value={store.searchQuery}
              onInput$={(e) => store.searchQuery = (e.target as HTMLInputElement).value}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <select
              value={store.filterStatus}
              onChange$={(e) => store.filterStatus = (e.target as HTMLSelectElement).value as any}
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            onClick$={() => store.activeTab = 'scraped'}
            class={`py-2 px-1 border-b-2 font-medium text-sm ${
              store.activeTab === 'scraped'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scraped Content ({filteredContent.length})
          </button>
          <button
            onClick$={() => store.activeTab = 'changes'}
            class={`py-2 px-1 border-b-2 font-medium text-sm ${
              store.activeTab === 'changes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Content Changes ({contentData.value.contentChanges.length})
          </button>
        </nav>
      </div>

      {/* Scraped Content Tab */}
      {store.activeTab === 'scraped' && (
        <div class="space-y-4">
          {filteredContent.length === 0 ? (
            <div class="text-center py-12">
              <div class="text-6xl mb-4">🕷️</div>
              <p class="text-gray-500 text-lg">No scraped content found</p>
              <p class="text-sm text-gray-400 mt-2">
                {store.searchQuery || store.filterStatus !== 'all' ? 
                  'Try adjusting your filters' : 
                  'Start scraping some URLs to see content here'
                }
              </p>
              {!store.searchQuery && store.filterStatus === 'all' && (
                <div class="mt-6 text-left max-w-md mx-auto">
                  <h3 class="text-sm font-medium text-gray-700 mb-3">What you'll see here:</h3>
                  <ul class="text-xs text-gray-600 space-y-1">
                    <li>• Raw HTML content from scraped pages</li>
                    <li>• Scraping metadata (timestamps, file sizes, duration)</li>
                    <li>• Success/failure status with error details</li>
                    <li>• Structured data extraction results</li>
                    <li>• Content change detection and analysis</li>
                    <li>• Full-text search and filtering capabilities</li>
                  </ul>
                  <p class="text-xs text-gray-500 mt-3">
                    Use the "Trigger Test Scraping" button above to generate sample content.
                  </p>
                </div>
              )}
            </div>
          ) : (
            filteredContent.map((content: ScrapedContentWithUrl) => (
              <div key={content.id} class="card hover:shadow-md transition-shadow cursor-pointer"
                   onClick$={() => openContentModal(content)}>
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class={`px-2 py-1 text-xs rounded-full ${getStatusColor(content.scrape_status)}`}>
                        {content.scrape_status || 'unknown'}
                      </span>
                      {content.discovered_urls?.page_type && (
                        <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {content.discovered_urls.page_type}
                        </span>
                      )}
                      {content.discovered_urls?.base_urls?.name && (
                        <span class="text-xs text-gray-500">
                          from {content.discovered_urls.base_urls.name}
                        </span>
                      )}
                    </div>
                    
                    <p class="text-sm font-medium text-primary-600 hover:text-primary-700 mb-2 truncate">
                      {content.discovered_urls?.url || 'Unknown URL'}
                    </p>
                    
                    <p class="text-sm text-gray-600 mb-3">
                      {formatContentPreview(content.raw_content)}
                    </p>
                    
                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        Scraped: {content.scraped_at ? new Date(content.scraped_at).toLocaleString() : 'Unknown'}
                      </span>
                      <span>
                        Size: {formatFileSize(content.content_length)}
                      </span>
                      {content.scrape_duration_ms && (
                        <span>
                          Duration: {content.scrape_duration_ms}ms
                        </span>
                      )}
                    </div>
                    
                    {content.error_message && (
                      <p class="text-sm text-red-600 mt-2 italic">
                        Error: {content.error_message}
                      </p>
                    )}
                  </div>
                  
                  <div class="flex-shrink-0 ml-4">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content Changes Tab */}
      {store.activeTab === 'changes' && (
        <div class="space-y-4">
          {contentData.value.contentChanges.length === 0 ? (
            <div class="text-center py-12">
              <div class="text-6xl mb-4">🔄</div>
              <p class="text-gray-500 text-lg">No content changes detected</p>
              <p class="text-sm text-gray-400 mt-2">
                Changes will appear here when content modifications are detected
              </p>
            </div>
          ) : (
            contentData.value.contentChanges.map((change: ContentChangeWithDetails) => (
              <div key={change.id} class="card">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class={`px-2 py-1 text-xs rounded-full ${getChangeTypeColor(change.change_type)}`}>
                        {change.change_type || 'unknown'}
                      </span>
                      {change.confidence_score && (
                        <span class="text-xs text-gray-500">
                          Confidence: {Math.round(change.confidence_score * 100)}%
                        </span>
                      )}
                    </div>
                    
                    <p class="text-sm font-medium text-primary-600 mb-2">
                      {change.discovered_urls?.url || 'Unknown URL'}
                    </p>
                    
                    <p class="text-sm text-gray-900 mb-2">
                      {change.change_summary || 'No summary available'}
                    </p>
                    
                    {change.change_details && (
                      <div class="bg-gray-50 p-3 rounded text-xs text-gray-600 mb-2">
                        <pre class="whitespace-pre-wrap">
                          {typeof change.change_details === 'string' ? 
                            change.change_details : 
                            JSON.stringify(change.change_details, null, 2)
                          }
                        </pre>
                      </div>
                    )}
                    
                    <p class="text-xs text-gray-500">
                      Detected: {change.detected_at ? new Date(change.detected_at).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content Detail Modal */}
      {store.showContentModal && store.selectedContent && (
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-gray-900">Scraped Content Details</h3>
              <button
                onClick$={closeContentModal}
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="space-y-4">
              <div>
                <h4 class="font-medium text-gray-900 mb-2">URL:</h4>
                <a 
                  href={store.selectedContent.discovered_urls?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="text-primary-600 hover:text-primary-700 break-all"
                >
                  {store.selectedContent.discovered_urls?.url}
                </a>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <h4 class="font-medium text-gray-900 mb-1">Status:</h4>
                  <span class={`px-2 py-1 text-xs rounded-full ${getStatusColor(store.selectedContent.scrape_status)}`}>
                    {store.selectedContent.scrape_status}
                  </span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 mb-1">Content Size:</h4>
                  <p class="text-sm text-gray-600">{formatFileSize(store.selectedContent.content_length)}</p>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 mb-1">Scraped At:</h4>
                  <p class="text-sm text-gray-600">
                    {store.selectedContent.scraped_at ? new Date(store.selectedContent.scraped_at).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 mb-1">Duration:</h4>
                  <p class="text-sm text-gray-600">
                    {store.selectedContent.scrape_duration_ms ? `${store.selectedContent.scrape_duration_ms}ms` : 'Unknown'}
                  </p>
                </div>
              </div>
              
              {store.selectedContent.error_message && (
                <div>
                  <h4 class="font-medium text-gray-900 mb-2">Error Message:</h4>
                  <p class="text-sm text-red-600 bg-red-50 p-3 rounded">{store.selectedContent.error_message}</p>
                </div>
              )}
              
              <div>
                <h4 class="font-medium text-gray-900 mb-2">Raw Content:</h4>
                <div class="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                  <pre class="text-xs text-gray-600 whitespace-pre-wrap">
                    {store.selectedContent.raw_content || 'No content available'}
                  </pre>
                </div>
              </div>
              
              {store.selectedContent.structured_data && (
                <div>
                  <h4 class="font-medium text-gray-900 mb-2">Structured Data:</h4>
                  <div class="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                    <pre class="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(store.selectedContent.structured_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div class="mt-6 flex justify-end">
              <button
                onClick$={closeContentModal}
                class="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}); 