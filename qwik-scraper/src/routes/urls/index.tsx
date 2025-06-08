import { component$, useStore, $ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { supabase } from '../../lib/supabase';
import type { BaseUrl, DiscoveredUrl } from '../../lib/supabase';

export const useUrlsLoader = routeLoader$(async () => {
  try {
    // Use localhost URLs since this is development
    const baseUrl = 'http://localhost:3000';
    
    const [baseUrlsResponse, infoUrlsResponse] = await Promise.allSettled([
      fetch(`${baseUrl}/base-urls`).then(r => r.json()),
      fetch(`${baseUrl}/info-urls`).then(r => r.json())
    ]);

    return {
      baseUrls: baseUrlsResponse.status === 'fulfilled' ? baseUrlsResponse.value : [],
      infoUrls: infoUrlsResponse.status === 'fulfilled' ? infoUrlsResponse.value : [],
      error: null,
      // Add some debugging info
      debug: {
        baseUrlsStatus: baseUrlsResponse.status,
        infoUrlsStatus: infoUrlsResponse.status,
        baseUrlsError: baseUrlsResponse.status === 'rejected' ? baseUrlsResponse.reason?.message : null,
        infoUrlsError: infoUrlsResponse.status === 'rejected' ? infoUrlsResponse.reason?.message : null
      }
    };
  } catch (error) {
    console.error('URLs loading error:', error);
    return {
      baseUrls: [],
      infoUrls: [],
      error: error instanceof Error ? error.message : 'Failed to load URLs data',
      debug: { error: 'Fetch failed' }
    };
  }
});

export default component$(() => {
  const urlsData = useUrlsLoader();
  const store = useStore({
    activeTab: 'base' as 'base' | 'discovered',
    showAddForm: false,
    newUrl: {
      url: '',
      name: '',
      description: '',
    },
    isLoading: false,
  });

  const addBaseUrl = $(async () => {
    if (!store.newUrl.url || !store.newUrl.name) return;
    
    store.isLoading = true;
    try {
      const { error } = await supabase
        .from('base_urls')
        .insert([{
          url: store.newUrl.url,
          name: store.newUrl.name,
          description: store.newUrl.description,
        }]);

      if (!error) {
        store.newUrl = { url: '', name: '', description: '' };
        store.showAddForm = false;
        // In a real app, you'd refresh the data here
      }
    } catch (error) {
      console.error('Error adding URL:', error);
    } finally {
      store.isLoading = false;
    }
  });

  const toggleUrlStatus = $(async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('base_urls')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (!error) {
        // In a real app, you'd refresh the data here
        console.log('URL status updated');
      }
    } catch (error) {
      console.error('Error updating URL status:', error);
    }
  });

  return (
    <div class="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">URL Management</h1>
          <p class="mt-2 text-sm text-gray-600">
            Manage base URLs and view discovered locations
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            onClick$={() => store.showAddForm = !store.showAddForm}
            class="btn btn-primary"
          >
            {store.showAddForm ? 'Cancel' : 'Add Base URL'}
          </button>
        </div>
      </div>

      {/* Add URL Form */}
      {store.showAddForm && (
        <div class="card mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Add New Base URL</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={store.newUrl.url}
                onInput$={(e) => store.newUrl.url = (e.target as HTMLInputElement).value}
                placeholder="https://example.com"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={store.newUrl.name}
                onInput$={(e) => store.newUrl.name = (e.target as HTMLInputElement).value}
                placeholder="Gym Chain Name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={store.newUrl.description}
                onInput$={(e) => store.newUrl.description = (e.target as HTMLTextAreaElement).value}
                placeholder="Optional description..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>
          </div>
          <div class="mt-4 flex space-x-3">
            <button
              onClick$={addBaseUrl}
              disabled={store.isLoading || !store.newUrl.url || !store.newUrl.name}
              class="btn btn-primary"
            >
              {store.isLoading ? 'Adding...' : 'Add URL'}
            </button>
            <button
              onClick$={() => store.showAddForm = false}
              class="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            onClick$={() => store.activeTab = 'base'}
            class={`py-2 px-1 border-b-2 font-medium text-sm ${
              store.activeTab === 'base'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Base URLs ({urlsData.value.baseUrls.length})
          </button>
          <button
            onClick$={() => store.activeTab = 'discovered'}
            class={`py-2 px-1 border-b-2 font-medium text-sm ${
              store.activeTab === 'discovered'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Info URLs ({urlsData.value.infoUrls.length})
          </button>
        </nav>
      </div>

      {/* Base URLs Tab */}
      {store.activeTab === 'base' && (
        <div class="space-y-4">
          {urlsData.value.baseUrls.length === 0 ? (
            <div class="text-center py-12">
              <p class="text-gray-500">No base URLs configured</p>
              <button
                onClick$={() => store.showAddForm = true}
                class="mt-4 btn btn-primary"
              >
                Add your first URL
              </button>
            </div>
          ) : (
            urlsData.value.baseUrls.map((url: BaseUrl) => (
              <div key={url.id} class="card">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <h3 class="text-lg font-medium text-gray-900">{url.name}</h3>
                      <span class={`px-2 py-1 text-xs rounded-full ${
                        url.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {url.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p class="text-primary-600 hover:text-primary-700 text-sm mt-1">
                      <a href={url.url} target="_blank" rel="noopener noreferrer">
                        {url.url}
                      </a>
                    </p>
                    {url.description && (
                      <p class="text-gray-600 text-sm mt-2">{url.description}</p>
                    )}
                    <p class="text-xs text-gray-500 mt-2">
                      Added: {url.created_at ? new Date(url.created_at).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      onClick$={() => toggleUrlStatus(url.id, url.is_active || false)}
                      class={`btn ${url.is_active ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {url.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Info URLs Tab */}
      {store.activeTab === 'discovered' && (
        <div class="space-y-4">
          {urlsData.value.infoUrls.length === 0 ? (
            <div class="text-center py-12">
              <p class="text-gray-500">No info URLs discovered yet</p>
              <p class="text-sm text-gray-400 mt-2">
                Run URL discovery to find location pages
              </p>
            </div>
          ) : (
            urlsData.value.infoUrls.map((url: any) => (
              <div key={url.id} class="card">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                      <span class={`px-2 py-1 text-xs rounded-full ${
                        url.page_type === 'locations' ? 'bg-green-100 text-green-800' :
                        url.page_type === 'sitemap' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {url.page_type || 'unknown'}
                      </span>
                      <span class={`px-2 py-1 text-xs rounded-full ${
                        url.discovered_by === 'agent' ? 'bg-purple-100 text-purple-800' :
                        url.discovered_by === 'scraper' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {url.discovered_by || 'unknown'}
                      </span>
                      {url.base_urls && (
                        <span class="text-xs text-gray-500">
                          from {url.base_urls.name}
                        </span>
                      )}
                    </div>
                    <p class="text-primary-600 hover:text-primary-700 text-sm">
                      <a href={url.url} target="_blank" rel="noopener noreferrer">
                        {url.url}
                      </a>
                    </p>
                    <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>
                        Discovered: {url.created_at ? new Date(url.created_at).toLocaleString() : 'Unknown'}
                      </span>
                      {url.last_scraped_at && (
                        <span>
                          Last scraped: {new Date(url.last_scraped_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <span class={`px-2 py-1 text-xs rounded-full ${
                      url.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {url.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}); 