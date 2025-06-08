import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// MCP Server communication tool for gym scraper operations
export const mcpServerTool = createTool({
  id: 'mcp_server_communication',
  description: 'Communicates with the MCP Server (App 1) to perform gym scraping operations via the NestJS scraper',
  inputSchema: z.object({
    operation: z.enum(['discover_urls', 'analyze_content', 'trigger_scrape']).describe('The operation to perform'),
    data: z.object({
      baseUrl: z.string().url().optional().describe('Base URL for discovery operations'),
      url: z.string().url().optional().describe('Specific URL for content analysis'),
      previousContent: z.string().optional().describe('Previous content for comparison'),
      urls: z.array(z.string().url()).optional().describe('URLs to trigger scraping for')
    }).describe('Operation-specific data')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    operation: z.string(),
    data: z.any(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { operation, data } = context;
    const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:8081'; // MCP Server (App 1) URL

    try {
      switch (operation) {
        case 'discover_urls':
          if (!data.baseUrl) {
            throw new Error('baseUrl is required for discover_urls operation');
          }
          
          // Call MCP Server to trigger URL discovery via NestJS scraper
          const discoveryResponse = await fetch(`${mcpServerUrl}/discover-urls`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              baseUrl: data.baseUrl
            })
          });

          if (!discoveryResponse.ok) {
            throw new Error(`MCP Server discovery failed: ${discoveryResponse.statusText}`);
          }

          const discoveryResult = await discoveryResponse.json();
          
          return {
            success: true,
            operation: 'discover_urls',
            data: {
              discoveredUrls: discoveryResult.urls || [],
              analysis: discoveryResult.analysis || 'URL discovery completed via MCP Server',
              priority: discoveryResult.priority || 'medium',
              source: 'mcp_server'
            }
          };

        case 'analyze_content':
          if (!data.url) {
            throw new Error('url is required for analyze_content operation');
          }

          // Call MCP Server to analyze content via NestJS scraper
          const analysisResponse = await fetch(`${mcpServerUrl}/analyze-content`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: data.url,
              previousContent: data.previousContent
            })
          });

          if (!analysisResponse.ok) {
            throw new Error(`MCP Server analysis failed: ${analysisResponse.statusText}`);
          }

          const analysisResult = await analysisResponse.json();

          return {
            success: true,
            operation: 'analyze_content',
            data: {
              hasLocationInfo: analysisResult.hasLocationInfo || false,
              locations: analysisResult.locations || [],
              changes: analysisResult.changes || [],
              confidence: analysisResult.confidence || 0,
              summary: analysisResult.summary || 'Content analysis completed via MCP Server',
              scrapedContent: analysisResult.content || '',
              source: 'mcp_server'
            }
          };

        case 'trigger_scrape':
          if (!data.urls || data.urls.length === 0) {
            throw new Error('urls array is required for trigger_scrape operation');
          }

          // Call MCP Server to trigger scraping of discovered URLs
          const scrapeResponse = await fetch(`${mcpServerUrl}/trigger-scrape`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              urls: data.urls
            })
          });

          if (!scrapeResponse.ok) {
            throw new Error(`MCP Server scrape trigger failed: ${scrapeResponse.statusText}`);
          }

          const scrapeResult = await scrapeResponse.json();

          return {
            success: true,
            operation: 'trigger_scrape',
            data: {
              jobId: scrapeResult.jobId || null,
              status: scrapeResult.status || 'triggered',
              message: scrapeResult.message || 'Scraping job triggered successfully',
              estimatedCompletion: scrapeResult.estimatedCompletion || null,
              source: 'mcp_server'
            }
          };

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      return {
        success: false,
        operation,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred during MCP Server communication'
      };
    }
  }
});

// Database communication tool for retrieving stored data
export const mcpDatabaseTool = createTool({
  id: 'mcp_database_query',
  description: 'Queries the database via MCP Server to retrieve stored gym location data and scraping results',
  inputSchema: z.object({
    query: z.enum(['get_base_urls', 'get_scraping_results', 'get_discovered_urls', 'get_location_changes']).describe('Type of database query'),
    params: z.object({
      limit: z.number().optional().describe('Maximum number of results to return'),
      offset: z.number().optional().describe('Number of results to skip'),
      baseUrl: z.string().url().optional().describe('Filter by base URL'),
      since: z.string().optional().describe('Filter results since this timestamp (ISO format)')
    }).optional().describe('Query parameters')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    query: z.string(),
    data: z.any(),
    count: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { query, params = {} } = context;
    const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:8081';

    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.baseUrl) queryParams.append('baseUrl', params.baseUrl);
      if (params.since) queryParams.append('since', params.since);

      const endpoint = getEndpointForQuery(query);
      const url = `${mcpServerUrl}${endpoint}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`MCP Server database query failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        query,
        data: result.data || result,
        count: result.count || (Array.isArray(result.data) ? result.data.length : undefined),
      };

    } catch (error) {
      return {
        success: false,
        query,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred during database query'
      };
    }
  }
});

// Helper function to map query types to endpoints
function getEndpointForQuery(query: string): string {
  switch (query) {
    case 'get_base_urls':
      return '/base-urls';
    case 'get_scraping_results':
      return '/scraping-results';
    case 'get_discovered_urls':
      return '/discovered-urls';
    case 'get_location_changes':
      return '/location-changes';
    default:
      throw new Error(`Unknown query type: ${query}`);
  }
} 