import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { mcpServerTool, mcpDatabaseTool } from '../tools/mcpServerTool';

export const analysisAgent = new Agent({
  name: 'Gym Content Analysis Agent',
  description: 'Intelligent agent that analyzes gym website content to extract location information and detect changes via MCP Server communication',
  instructions: `
You are an intelligent gym content analysis agent that works through the MCP Server architecture. Your role is to:

**PRIMARY FUNCTION:**
- Analyze scraped gym website content to extract location information
- Detect changes in gym locations (new openings, closures, updates)
- Communicate with the MCP Server (App 1) which coordinates with the NestJS scraper (App 2)
- Provide structured analysis with confidence scores

**MCP SERVER COMMUNICATION:**
- Always use the mcp_server_communication tool to analyze content via the MCP Server
- The MCP Server handles all web scraping and content retrieval through the NestJS scraper
- You focus on intelligent analysis of the content that's provided to you

**ANALYSIS PROCESS:**
1. Use mcp_database_query to check for existing content and previous analysis
2. Use mcp_server_communication with operation 'analyze_content' to get current content
3. Compare current content with previous versions to detect changes
4. Extract and structure location information with confidence scores

**LOCATION EXTRACTION:**
Look for and extract:
- **Addresses**: Complete street addresses, cities, states, zip codes
- **Phone Numbers**: Contact numbers for specific locations
- **Hours**: Operating hours and schedules
- **Status**: Open/closed status, grand opening announcements
- **Amenities**: Services offered at each location
- **Coordinates**: Latitude/longitude if available

**CHANGE DETECTION:**
- **New Locations**: Previously unseen gym locations
- **Closures**: Locations that are no longer listed or marked as closed
- **Updates**: Changes to hours, phone numbers, services, or addresses
- **Status Changes**: Opening soon → open, temporary closures, etc.

**OUTPUT FORMAT:**
Always provide structured analysis including:
- Extracted location data with confidence scores (0-100)
- List of detected changes with change type and confidence
- Summary of findings with actionable insights
- Recommendations for follow-up actions

**CONFIDENCE SCORING:**
- **90-100**: Clear, unambiguous location data with full address details
- **70-89**: Good location data but missing some details (no phone, partial address)
- **50-69**: Likely location data but needs verification
- **Below 50**: Uncertain data that requires human review

**IMPORTANT:**
- Never attempt direct web scraping - always go through the MCP Server
- Focus on intelligent content analysis rather than technical data retrieval
- Provide clear reasoning for your confidence scores and findings
- Be thorough in change detection to catch new openings or closures
`,
  model: openai('gpt-4o-mini'),
  tools: {
    mcpServerTool,
    mcpDatabaseTool,
  },
});

export async function analyzeLocationContent(
  content: string, 
  previousContent?: string
): Promise<{
  success: boolean;
  hasLocationInfo: boolean;
  locations: Array<{
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    status?: 'opening_soon' | 'now_open' | 'coming_soon';
    confidence: number;
  }>;
  changes: Array<{
    type: 'new_location' | 'updated_location' | 'removed_location' | 'content_change';
    description: string;
    location?: string;
  }>;
  summary: string;
  confidence: number;
  error?: string;
}> {
  try {
    const analysisPrompt = previousContent 
      ? `Please analyze the following web content for gym/fitness location information and compare it with the previous version to detect any changes.

Current Content:
${content}

Previous Content:
${previousContent}

Tasks:
1. Use the content analysis tool to detect location information
2. Use the tool to compare with previous content and identify changes
3. Extract any new gym locations with their details
4. Provide a summary of findings and confidence assessment`
      : `Please analyze the following web content to identify gym/fitness location information:

Content:
${content}

Tasks:
1. Use the content analysis tool to detect if this contains location information
2. Extract any gym locations with details like addresses, phone numbers, and status
3. Provide a confidence assessment of your findings`;

    const response = await analysisAgent.generate(analysisPrompt, {
      maxSteps: 5
    });

    // Extract structured data from the agent's tool usage
    // This is simplified - in practice, you'd parse the tool results more carefully
    const text = response.text;
    
    // Parse the response to extract structured information
    // This is a basic implementation - you might want to use structured output
    const hasLocationKeywords = [
      'address', 'location', 'phone', 'gym', 'fitness',
      'street', 'avenue', 'road', 'boulevard'
    ].some(keyword => content.toLowerCase().includes(keyword));

    const statusKeywords = [
      'now open', 'opening soon', 'coming soon', 'grand opening'
    ];

    const hasStatusIndicators = statusKeywords.some(status => 
      content.toLowerCase().includes(status)
    );

    // Simple confidence calculation
    const confidence = hasLocationKeywords ? (hasStatusIndicators ? 0.9 : 0.7) : 0.3;

    return {
      success: true,
      hasLocationInfo: hasLocationKeywords,
      locations: [], // Would be populated from tool analysis
      changes: [], // Would be populated from change detection
      summary: `Analysis complete. ${hasLocationKeywords ? 'Location information detected' : 'No clear location information found'}. ${hasStatusIndicators ? 'Status indicators found.' : ''}`,
      confidence
    };

  } catch (error) {
    return {
      success: false,
      hasLocationInfo: false,
      locations: [],
      changes: [],
      summary: 'Analysis failed',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function extractGymLocations(content: string): Promise<{
  success: boolean;
  locations: Array<{
    name: string;
    address?: string;
    phone?: string;
    status?: string;
  }>;
  confidence: number;
  error?: string;
}> {
  try {
    const response = await analysisAgent.generate(
      `Extract gym location information from this content:

      ${content}

      Use the content analysis tool to extract structured location data. Focus on finding:
      - Gym names
      - Addresses  
      - Phone numbers
      - Opening status`,
      {
        maxSteps: 3
      }
    );

    // Basic location extraction (simplified)
    const locations: Array<{
      name: string;
      address?: string;
      phone?: string;
      status?: string;
    }> = [];

    // This would typically be extracted from the tool results
    // For now, we'll do basic pattern matching
    const addressPattern = /\d+[^,\n]*(?:street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr)[^,\n]*/gi;
    const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    
    const addresses = content.match(addressPattern) || [];
    const phones = content.match(phonePattern) || [];

    addresses.forEach((address, index) => {
      locations.push({
        name: `Location ${index + 1}`,
        address: address.trim(),
        phone: phones[index]
      });
    });

    return {
      success: true,
      locations,
      confidence: locations.length > 0 ? 0.8 : 0.2
    };

  } catch (error) {
    return {
      success: false,
      locations: [],
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 