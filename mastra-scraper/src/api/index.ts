import { mastra } from '../mastra/index.js';
import { analyzeLocationContent } from '../mastra/agents/analysisAgent.js';

/**
 * API endpoint for analyzing content using Mastra agents
 * Called by the MCP Bridge at http://localhost:4111/analyze-content
 */
export async function analyzeContent(c: any) {
  try {
    const body = await c.req.json();
    const { content, previousContent, url, infoUrlId } = body;

    if (!content) {
      return c.json({ 
        success: false, 
        error: 'content is required' 
      }, 400);
    }

    console.log('🤖 Mastra Agent: Starting AI analysis for URL:', url);
    console.log('🤖 Content length:', content.length, 'characters');

    // Use the analysis agent directly for content analysis
    const analysisResult = await analyzeLocationContent(
      content, 
      previousContent
    );

    if (!analysisResult.success) {
      console.error('🤖 Analysis failed:', analysisResult.error);
      return c.json({
        success: false,
        error: analysisResult.error || 'Analysis failed'
      }, 500);
    }

    console.log('🤖 Analysis completed successfully');
    console.log('🤖 Has location info:', analysisResult.hasLocationInfo);
    console.log('🤖 Confidence:', analysisResult.confidence);
    console.log('🤖 Locations found:', analysisResult.locations.length);
    console.log('🤖 Changes detected:', analysisResult.changes.length);

    // Return the structured analysis result
    return c.json({
      success: true,
      source: 'mastra-ai',
      hasLocationInfo: analysisResult.hasLocationInfo,
      confidence: analysisResult.confidence,
      summary: analysisResult.summary,
      locations: analysisResult.locations,
      changes: analysisResult.changes,
      url,
      infoUrlId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🤖 Mastra API Error:', error);
    
    return c.json({
      success: false,
      source: 'mastra-ai',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, 500);
  }
}

/**
 * Health check endpoint
 */
export async function healthCheck(c: any) {
  try {
    return c.json({
      status: 'healthy',
      service: 'mastra-ai-agents',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

/**
 * Test endpoint for agent functionality
 */
export async function testAgent(c: any) {
  try {
    const testContent = `
      Welcome to Planet Fitness! Our new location at 123 Main Street, Downtown, CA 90210 is now open!
      Phone: (555) 123-4567
      Hours: Mon-Fri 5AM-12AM, Sat-Sun 7AM-7PM
      
      Another location coming soon to 456 Oak Avenue, Westside, CA 90211
      Contact: (555) 987-6543
      Grand Opening: December 2024
    `;

    console.log('🤖 Testing Mastra agent with sample content...');
    
    const result = await analyzeLocationContent(testContent);
    
    return c.json({
      success: true,
      message: 'Agent test completed',
      result
    });

  } catch (error) {
    console.error('🤖 Agent test failed:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }, 500);
  }
}

// Functions are already exported individually above 