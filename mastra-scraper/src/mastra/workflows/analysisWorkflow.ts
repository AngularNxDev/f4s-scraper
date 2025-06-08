import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Single step that uses MCP Server to analyze content
const mcpAnalyzeContentStep = createStep({
  id: 'mcp-analyze-content',
  description: 'Analyze content from URL via MCP Server for gym location information',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to analyze'),
    previousContent: z.string().optional().describe('Previous version of content for comparison')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    url: z.string(),
    hasLocationInfo: z.boolean(),
    locations: z.array(z.object({
      name: z.string(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      phone: z.string().optional(),
      status: z.enum(['opening_soon', 'now_open', 'coming_soon']).optional(),
      confidence: z.number()
    })),
    changes: z.array(z.object({
      type: z.enum(['new_location', 'updated_location', 'removed_location', 'content_change']),
      description: z.string(),
      location: z.string().optional()
    })),
    summary: z.string(),
    confidence: z.number(),
    scrapedContent: z.string(),
    error: z.string().optional()
  }),
  execute: async ({ inputData }) => {
    const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:8081';
    
    try {
      // Call MCP Server to analyze content
      const analysisResponse = await fetch(`${mcpServerUrl}/analyze-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: inputData.url,
          previousContent: inputData.previousContent
        })
      });

      if (!analysisResponse.ok) {
        throw new Error(`MCP Server analysis failed: ${analysisResponse.statusText}`);
      }

      const analysisResult = await analysisResponse.json();
      
      // Structure the response according to our schema
      return {
        success: true,
        url: inputData.url,
        hasLocationInfo: analysisResult.hasLocationInfo || false,
        locations: analysisResult.locations || [],
        changes: analysisResult.changes || [],
        confidence: analysisResult.confidence || 0,
        summary: analysisResult.summary || 'Content analysis completed via MCP Server',
        scrapedContent: analysisResult.content || '',
      };

    } catch (error) {
      return {
        success: false,
        url: inputData.url,
        hasLocationInfo: false,
        locations: [],
        changes: [],
        summary: 'Failed to analyze content via MCP Server',
        confidence: 0,
        scrapedContent: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred during MCP Server communication'
      };
    }
  }
});

// Create the content analysis workflow
export const contentAnalysisWorkflow = createWorkflow({
  id: 'gym-content-analysis-workflow-mcp',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to analyze'),
    previousContent: z.string().optional().describe('Previous version of content for comparison')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    url: z.string(),
    hasLocationInfo: z.boolean(),
    locations: z.array(z.object({
      name: z.string(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      phone: z.string().optional(),
      status: z.enum(['opening_soon', 'now_open', 'coming_soon']).optional(),
      confidence: z.number()
    })),
    changes: z.array(z.object({
      type: z.enum(['new_location', 'updated_location', 'removed_location', 'content_change']),
      description: z.string(),
      location: z.string().optional()
    })),
    summary: z.string(),
    confidence: z.number(),
    scrapedContent: z.string(),
    error: z.string().optional()
  })
})
  .then(mcpAnalyzeContentStep);

// Commit the workflow
contentAnalysisWorkflow.commit();

export type ContentAnalysisWorkflowInput = {
  url: string;
  previousContent?: string;
};

export type ContentAnalysisWorkflowOutput = {
  success: boolean;
  url: string;
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
  scrapedContent: string;
  error?: string;
}; 