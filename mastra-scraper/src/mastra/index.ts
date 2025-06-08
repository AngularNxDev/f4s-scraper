import { Mastra } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { registerApiRoute } from '@mastra/core/server';

// Import MCP-based agents
import { discoveryAgent } from './agents/discoveryAgent';
import { analysisAgent } from './agents/analysisAgent';

// Import MCP-based workflows  
import { discoveryWorkflow } from './workflows/discoveryWorkflow';
import { contentAnalysisWorkflow } from './workflows/analysisWorkflow';

// Import MCP tools
import { mcpServerTool, mcpDatabaseTool } from './tools/mcpServerTool';

// Import API handlers
import { analyzeContent, healthCheck, testAgent } from '../api/index.js';

// Configure Mastra with MCP-based components and API routes
export const mastra = new Mastra({
  agents: {
    discoveryAgent: discoveryAgent,
    analysisAgent: analysisAgent,
  },
  
  workflows: {
    discoveryWorkflow: discoveryWorkflow,
    contentAnalysisWorkflow: contentAnalysisWorkflow,
  },

  server: {
    port: 4111,
    apiRoutes: [
      registerApiRoute('/analyze-content', {
        method: 'POST',
        handler: analyzeContent,
      }),
      registerApiRoute('/health', {
        method: 'GET', 
        handler: healthCheck,
      }),
      registerApiRoute('/test-agent', {
        method: 'POST',
        handler: testAgent,
      }),
    ],
  },
});

// Export individual components for direct use
export { discoveryAgent, analysisAgent };
export { discoveryWorkflow, contentAnalysisWorkflow };
export { mcpServerTool, mcpDatabaseTool };

// Export types
export type { 
  DiscoveryWorkflowInput, 
  DiscoveryWorkflowOutput 
} from './workflows/discoveryWorkflow';

export type { 
  ContentAnalysisWorkflowInput, 
  ContentAnalysisWorkflowOutput 
} from './workflows/analysisWorkflow';
        