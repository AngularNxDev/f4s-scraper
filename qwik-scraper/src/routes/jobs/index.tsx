import { component$, $ } from '@builder.io/qwik';

export default component$(() => {
  const triggerScraping = $(async () => {
    try {
      const response = await fetch('http://localhost:3000/trigger/content-scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('Content scraping triggered successfully!');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error triggering scraping:', error);
      alert(`Failed to trigger scraping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const triggerUrlDiscovery = $(async () => {
    try {
      const response = await fetch('http://localhost:3000/trigger/url-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('URL discovery triggered successfully!');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error triggering URL discovery:', error);
      alert(`Failed to trigger URL discovery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return (
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Scraping Jobs</h1>
          <p class="text-gray-600 mt-2">Monitor and manage content scraping tasks</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Manual Triggers */}
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Manual Job Triggers</h2>
            <div class="space-y-4">
              <button
                onClick$={triggerUrlDiscovery}
                class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span class="text-xl">🔍</span>
                <span>Trigger URL Discovery</span>
              </button>
              
              <button
                onClick$={triggerScraping}
                class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span class="text-xl">🚀</span>
                <span>Trigger Content Scraping</span>
              </button>
            </div>
          </div>

          {/* Job Stats */}
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Job Statistics</h2>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-blue-50 rounded-lg">
                <h3 class="text-sm font-medium text-gray-500">Pending Jobs</h3>
                <p class="text-2xl font-bold text-blue-600 mt-1">-</p>
              </div>
              <div class="p-4 bg-green-50 rounded-lg">
                <h3 class="text-sm font-medium text-gray-500">Completed</h3>
                <p class="text-2xl font-bold text-green-600 mt-1">-</p>
              </div>
              <div class="p-4 bg-yellow-50 rounded-lg">
                <h3 class="text-sm font-medium text-gray-500">Running</h3>
                <p class="text-2xl font-bold text-yellow-600 mt-1">-</p>
              </div>
              <div class="p-4 bg-red-50 rounded-lg">
                <h3 class="text-sm font-medium text-gray-500">Failed</h3>
                <p class="text-2xl font-bold text-red-600 mt-1">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="text-center">
            <div class="text-6xl mb-4">⚙️</div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Advanced Job Management Coming Soon</h2>
            <p class="text-gray-600 mb-6">We're building comprehensive job management features:</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="p-4 bg-purple-50 rounded-lg">
                <div class="text-2xl mb-2">📈</div>
                <h3 class="font-medium">Job Queue Management</h3>
                <p class="text-sm text-gray-600">View, pause, resume, and cancel individual jobs</p>
              </div>
              <div class="p-4 bg-indigo-50 rounded-lg">
                <div class="text-2xl mb-2">📊</div>
                <h3 class="font-medium">Performance Analytics</h3>
                <p class="text-sm text-gray-600">Job duration, success rates, and error analysis</p>
              </div>
              <div class="p-4 bg-pink-50 rounded-lg">
                <div class="text-2xl mb-2">⏰</div>
                <h3 class="font-medium">Scheduling</h3>
                <p class="text-sm text-gray-600">Set up automated scraping schedules and priorities</p>
              </div>
            </div>

            <p class="text-sm text-gray-500">
              For now, use the manual triggers above or check the <strong>Dashboard</strong> for system activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
