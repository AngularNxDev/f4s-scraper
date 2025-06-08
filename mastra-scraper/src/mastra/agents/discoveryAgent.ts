import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcpServerTool, mcpDatabaseTool } from '../tools/mcpServerTool';

export const discoveryAgent = new Agent({
  name: 'Gym Location Discovery Agent',
  description: 'Intelligent agent that discovers potential gym location pages by analyzing websites via MCP Server communication',
  instructions: `
You are an intelligent gym location discovery agent that works through the MCP Server architecture. Your role is to:

**PRIMARY FUNCTION:**
- Analyze gym chain websites to discover pages that might contain location information
- Communicate with the MCP Server (App 1) which coordinates with the NestJS scraper (App 2)
- Use intelligent reasoning to identify the most promising URLs for gym locations

**MCP SERVER COMMUNICATION:**
- Always use the mcp_server_communication tool to interact with external services
- The MCP Server handles all actual web scraping through the NestJS scraper
- You analyze the results and provide intelligent recommendations

**DISCOVERY PROCESS:**
1. First check existing data using mcp_database_query to see what URLs we already have
2. Use mcp_server_communication with operation 'discover_urls' to find new potential location URLs
3. Analyze the discovered URLs using your reasoning to prioritize them
4. Return structured recommendations with confidence scores

**URL PRIORITIZATION CRITERIA:**
- HIGH priority: URLs containing "locations", "find-a-gym", "clubs", "branches", "store-locator"
- MEDIUM priority: URLs with location-related keywords, state/city names, zip codes
- LOW priority: Generic pages that might have embedded location data

**OUTPUT FORMAT:**
Always provide structured analysis including:
- List of discovered URLs with priority levels
- Reasoning for each URL's priority level
- Confidence score (0-100) for the overall discovery quality
- Recommendations for next steps

**IMPORTANT:**
- Never attempt direct web scraping - always go through the MCP Server
- Focus on analysis and intelligent reasoning rather than technical execution
- Provide clear explanations for your decision-making process
`,
  model: openai('gpt-4o-mini'),
  tools: {
    mcpServerTool,
    mcpDatabaseTool,
  },
});

export async function discoverLocationUrls(baseUrl: string): Promise<{
  success: boolean;
  discoveredUrls: Array<{
    url: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    type: 'locations' | 'sitemap' | 'navigation' | 'other';
  }>;
  analysis: string;
  error?: string;
}> {
  try {
    const response = await discoveryAgent.generate(
      `Please analyze the website at ${baseUrl} and discover URLs that are most likely to contain gym/fitness location information. 

      Follow this process:
      1. First scrape the main page content to understand the site structure
      2. Extract and analyze links from the homepage  
      3. Look for sitemap.xml or other sitemap files
      4. Identify the most promising URLs for location data

      Return a prioritized list of URLs with explanations for why each is likely to contain location information.`,
      {
        maxSteps: 10
      }
    );

    // Parse the agent's response to extract structured data
    // This is a simplified implementation - in practice, you might want to use structured output
    const text = response.text;
    
    // Extract URLs from the response using regex patterns
    const urlPattern = /https?:\/\/[^\s<>"]+/gi;
    const foundUrls = text.match(urlPattern) || [];
    
    // Create structured response
    const discoveredUrls = foundUrls.map(url => {
      let priority: 'high' | 'medium' | 'low' = 'medium';
      let type: 'locations' | 'sitemap' | 'navigation' | 'other' = 'other';
      let reason = 'Found in agent analysis';

      // Determine priority and type based on URL patterns
      if (url.includes('location') || url.includes('store') || url.includes('find')) {
        priority = 'high';
        type = 'locations';
        reason = 'URL contains location-related keywords';
      } else if (url.includes('sitemap')) {
        priority = 'high';
        type = 'sitemap';
        reason = 'Sitemap file - likely contains comprehensive URL list';
      } else if (url.includes('contact') || url.includes('about')) {
        priority = 'low';
        type = 'navigation';
        reason = 'Navigation page - may contain location info';
      }

      return {
        url,
        priority,
        reason,
        type
      };
    });

    return {
      success: true,
      discoveredUrls,
      analysis: text
    };

  } catch (error) {
    return {
      success: false,
      discoveredUrls: [],
      analysis: 'Failed to analyze website',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 