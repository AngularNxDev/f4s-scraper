import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Step to discover URLs using MCP Server communication
const urlDiscoveryStep = createStep({
  id: 'url-discovery-via-mcp',
  description: 'Discover URLs that likely contain gym location information via MCP Server',
  inputSchema: z.object({
    baseUrl: z.string().url().describe('The base URL to analyze for location information'),
    skipExistingCheck: z.boolean().optional().default(false).describe('Whether to skip checking for existing discovered URLs')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    baseUrl: z.string(),
    discoveredUrls: z.array(z.object({
      url: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      confidence: z.number(),
      reasoning: z.string()
    })),
    analysis: z.string(),
    recommendations: z.array(z.string()),
    nextSteps: z.array(z.string()),
    error: z.string().optional()
  }),
  execute: async ({ inputData }) => {
    const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:8081';
    
    try {
      // Step 1: Check existing data if requested
      let existingUrls: string[] = [];
      
      if (!inputData.skipExistingCheck) {
        try {
          const existingResponse = await fetch(`${mcpServerUrl}/discovered-urls?baseUrl=${encodeURIComponent(inputData.baseUrl)}&limit=100`);
          if (existingResponse.ok) {
            const existingData = await existingResponse.json();
            existingUrls = Array.isArray(existingData.data) 
              ? existingData.data.map((item: any) => item.url || item)
              : [];
          }
        } catch (error) {
          console.log('Could not check existing URLs, proceeding with discovery');
        }
      }

      // Step 2: Perform URL discovery via MCP Server
      const discoveryResponse = await fetch(`${mcpServerUrl}/discover-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: inputData.baseUrl
        })
      });

      if (!discoveryResponse.ok) {
        throw new Error(`MCP Server discovery failed: ${discoveryResponse.statusText}`);
      }

      const discoveryResult = await discoveryResponse.json();
      const allDiscoveredUrls = discoveryResult.urls || [];
      
      // Filter out existing URLs
      const newUrls = allDiscoveredUrls.filter((url: string) => 
        !existingUrls.includes(url)
      );

      // Step 3: Analyze and prioritize URLs
      const analysisPrompt = `
Analyzing discovered URLs for gym website: ${inputData.baseUrl}

Discovered URLs (${newUrls.length} new, ${existingUrls.length} existing):
${newUrls.length > 0 ? newUrls.map((url: string) => `- ${url}`).join('\n') : 'No new URLs found'}

Discovery result from MCP Server:
${JSON.stringify(discoveryResult, null, 2)}

Analysis: The MCP Server has completed URL discovery. Based on the discovered URLs, we can prioritize them for content analysis.
`;

      // Create structured URLs with basic priority analysis
      const structuredUrls = newUrls.map((url: string) => {
        const urlLower = url.toLowerCase();
        let priority: 'high' | 'medium' | 'low' = 'medium';
        let confidence = 70;
        let reasoning = 'Standard URL discovered via MCP Server';

        // High priority URL patterns
        if (urlLower.includes('location') || urlLower.includes('find-a-gym') || 
            urlLower.includes('clubs') || urlLower.includes('branches') || 
            urlLower.includes('store-locator') || urlLower.includes('sitemap')) {
          priority = 'high';
          confidence = 90;
          reasoning = 'Contains high-priority location keywords';
        }
        // Medium priority patterns
        else if (urlLower.includes('about') || urlLower.includes('contact') ||
                 urlLower.includes('gym') || urlLower.includes('fitness')) {
          priority = 'medium';
          confidence = 75;
          reasoning = 'Contains relevant gym/fitness keywords';
        }
        // Low priority
        else {
          priority = 'low';
          confidence = 50;
          reasoning = 'Generic URL that may contain embedded location data';
        }

        return {
          url,
          priority,
          confidence,
          reasoning
        };
      });

      return {
        success: true,
        baseUrl: inputData.baseUrl,
        discoveredUrls: structuredUrls,
        analysis: analysisPrompt,
        recommendations: [
          'Review high-priority URLs first for immediate scraping',
          'Consider triggering content analysis workflow for priority URLs',
          'Monitor for additional URLs on future discovery runs'
        ],
        nextSteps: [
          'Use content analysis workflow to scrape high-priority URLs',
          'Store discovery results in database via MCP Server',
          'Schedule regular re-discovery for this domain'
        ]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during MCP Server communication';
      return {
        success: false,
        baseUrl: inputData.baseUrl,
        discoveredUrls: [],
        analysis: `Error during discovery: ${errorMessage}`,
        recommendations: ['Review MCP Server connection and retry discovery'],
        nextSteps: ['Fix underlying MCP Server issue and retry'],
        error: errorMessage
      };
    }
  }
});

// Create the workflow
export const discoveryWorkflow = createWorkflow({
  id: 'gym-url-discovery-workflow-mcp',
  inputSchema: z.object({
    baseUrl: z.string().url().describe('The base URL to analyze for location information'),
    skipExistingCheck: z.boolean().optional().default(false).describe('Whether to skip checking for existing discovered URLs')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    baseUrl: z.string(),
    discoveredUrls: z.array(z.object({
      url: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      confidence: z.number(),
      reasoning: z.string()
    })),
    analysis: z.string(),
    recommendations: z.array(z.string()),
    nextSteps: z.array(z.string()),
    error: z.string().optional()
  })
})
  .then(urlDiscoveryStep);

// Commit the workflow
discoveryWorkflow.commit();

export type DiscoveryWorkflowInput = {
  baseUrl: string;
  skipExistingCheck?: boolean;
};

export type DiscoveryWorkflowOutput = {
  success: boolean;
  baseUrl: string;
  discoveredUrls: Array<{
    url: string;
    priority: 'high' | 'medium' | 'low';
    confidence: number;
    reasoning: string;
  }>;
  analysis: string;
  recommendations: Array<string>;
  nextSteps: Array<string>;
  error?: string;
}; 