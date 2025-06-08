import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const contentAnalysisTool = createTool({
  id: 'content_analysis',
  description: 'Analyzes scraped web content to identify gym location information, new openings, or relevant changes',
  inputSchema: z.object({
    content: z.string().describe('The web content to analyze'),
    previousContent: z.string().optional().describe('Previous version of the content for comparison'),
    analysisType: z.enum(['location_detection', 'change_detection', 'gym_info_extraction']).describe('Type of analysis to perform')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    analysisType: z.string(),
    findings: z.object({
      hasLocationInfo: z.boolean(),
      newLocations: z.array(z.object({
        name: z.string(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        status: z.enum(['opening_soon', 'now_open', 'coming_soon']).optional()
      })),
      changesDetected: z.boolean(),
      changes: z.array(z.object({
        type: z.enum(['new_location', 'updated_location', 'removed_location', 'content_change']),
        description: z.string(),
        location: z.string().optional()
      })),
      confidence: z.number().min(0).max(1)
    }),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { content, previousContent, analysisType } = context;
    
    try {
      switch (analysisType) {
        case 'location_detection':
          return analyzeForLocations(content);
        case 'change_detection':
          return analyzeForChanges(content, previousContent);
        case 'gym_info_extraction':
          return extractGymInformation(content);
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }
    } catch (error) {
      return {
        success: false,
        analysisType,
        findings: {
          hasLocationInfo: false,
          newLocations: [],
          changesDetected: false,
          changes: [],
          confidence: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
});

function analyzeForLocations(content: string) {
  const locationPatterns = [
    /(?:gym|fitness|location|store|club)\s+(?:at|in|on)\s+([^,\n]+)/gi,
    /(\d+[^,\n]*(?:street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr)[^,\n]*)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s+(\d{5})/gi
  ];

  const statusPatterns = [
    { pattern: /(?:opening soon|coming soon|now open|grand opening)/gi, status: 'opening_soon' as const },
    { pattern: /(?:now open|currently open|open now)/gi, status: 'now_open' as const },
    { pattern: /(?:coming soon|opening later|future location)/gi, status: 'coming_soon' as const }
  ];

  const locations: Array<{
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    status?: 'opening_soon' | 'now_open' | 'coming_soon';
  }> = [];

  // Extract addresses
  locationPatterns.forEach(pattern => {
    const matches = Array.from(content.matchAll(pattern));
    matches.forEach(match => {
      const addressMatch = match[1]?.trim();
      if (addressMatch && addressMatch.length > 5) {
        // Try to extract phone numbers near this location
        const phonePattern = /(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
        const contextStart = Math.max(0, match.index! - 200);
        const contextEnd = Math.min(content.length, match.index! + 200);
        const context = content.slice(contextStart, contextEnd);
        const phoneMatch = context.match(phonePattern);

        // Determine status
        let status: 'opening_soon' | 'now_open' | 'coming_soon' | undefined;
        for (const statusPattern of statusPatterns) {
          if (statusPattern.pattern.test(context)) {
            status = statusPattern.status;
            break;
          }
        }

        locations.push({
          name: addressMatch,
          address: addressMatch,
          phone: phoneMatch?.[0],
          status
        });
      }
    });
  });

  return {
    success: true,
    analysisType: 'location_detection',
    findings: {
      hasLocationInfo: locations.length > 0,
      newLocations: locations,
      changesDetected: false,
      changes: [],
      confidence: locations.length > 0 ? 0.8 : 0.2
    }
  };
}

function analyzeForChanges(content: string, previousContent?: string) {
  if (!previousContent) {
    return {
      success: true,
      analysisType: 'change_detection',
      findings: {
        hasLocationInfo: false,
        newLocations: [],
        changesDetected: false,
        changes: [],
        confidence: 0
      }
    };
  }

  const changes: Array<{
    type: 'new_location' | 'updated_location' | 'removed_location' | 'content_change';
    description: string;
    location?: string;
  }> = [];

  // Simple content comparison
  const contentLength = content.length;
  const previousContentLength = previousContent.length;
  const lengthDifference = Math.abs(contentLength - previousContentLength);
  
  if (lengthDifference > 100) {
    changes.push({
      type: 'content_change',
      description: `Significant content change detected. Content length changed by ${lengthDifference} characters.`
    });
  }

  // Look for new location indicators
  const newLocationIndicators = [
    'new location',
    'now open',
    'grand opening',
    'coming soon to',
    'opening in'
  ];

  newLocationIndicators.forEach(indicator => {
    const inCurrent = content.toLowerCase().includes(indicator);
    const inPrevious = previousContent.toLowerCase().includes(indicator);
    
    if (inCurrent && !inPrevious) {
      changes.push({
        type: 'new_location',
        description: `New location indicator detected: "${indicator}"`
      });
    }
  });

  return {
    success: true,
    analysisType: 'change_detection',
    findings: {
      hasLocationInfo: false,
      newLocations: [],
      changesDetected: changes.length > 0,
      changes,
      confidence: changes.length > 0 ? 0.7 : 0.3
    }
  };
}

function extractGymInformation(content: string) {
  const gymKeywords = [
    'gym', 'fitness', 'workout', 'exercise', 'training',
    'health club', 'fitness center', 'athletic club'
  ];

  const hasGymContent = gymKeywords.some(keyword => 
    content.toLowerCase().includes(keyword)
  );

  // Extract potential gym names
  const gymNamePatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Gym|Fitness|Health Club|Athletic Club))/gi,
    /((?:Gym|Fitness|Health Club|Athletic Club)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
  ];

  const gymNames: string[] = [];
  gymNamePatterns.forEach(pattern => {
    const matches = Array.from(content.matchAll(pattern));
    matches.forEach(match => {
      if (match[1] && !gymNames.includes(match[1])) {
        gymNames.push(match[1].trim());
      }
    });
  });

  return {
    success: true,
    analysisType: 'gym_info_extraction',
    findings: {
      hasLocationInfo: hasGymContent,
      newLocations: gymNames.map(name => ({ name })),
      changesDetected: false,
      changes: [],
      confidence: hasGymContent ? 0.8 : 0.1
    }
  };
} 