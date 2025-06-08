import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const webScraperTool = createTool({
  id: 'web_scraper',
  description: 'Scrapes web content from a given URL and extracts relevant information like sitemaps, links, or content',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to scrape'),
    extractType: z.enum(['sitemap', 'links', 'content']).describe('Type of extraction to perform'),
    selector: z.string().optional().describe('CSS selector for specific content extraction')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.union([z.array(z.string()), z.string()]).nullable(),
    type: z.string(),
    error: z.string().optional()
  }),
  execute: async ({ context }) => {
    const { url, extractType, selector } = context;
    
    try {
      // This would typically use Playwright or similar
      // For now, we'll simulate the scraping logic
      const response = await fetch(url);
      const html = await response.text();
      
      switch (extractType) {
        case 'sitemap':
          return {
            success: true,
            data: extractSitemapUrls(html),
            type: 'sitemap'
          };
        case 'links':
          return {
            success: true,
            data: extractLinks(html, url),
            type: 'links'
          };
        case 'content':
          return {
            success: true,
            data: extractContent(html, selector),
            type: 'content'
          };
        default:
          throw new Error(`Unknown extract type: ${extractType}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        type: extractType
      };
    }
  }
});

function extractSitemapUrls(html: string): string[] {
  // Extract sitemap URLs or sitemap.xml references
  const sitemapRegex = /<loc[^>]*>(.*?)<\/loc>/gi;
  const matches = html.match(sitemapRegex) || [];
  return matches.map(match => match.replace(/<\/?loc[^>]*>/gi, '').trim());
}

function extractLinks(html: string, baseUrl: string): string[] {
  // Extract all links from the page
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    if (href.startsWith('/')) {
      href = new URL(href, baseUrl).toString();
    }
    matches.push(href);
  }
  
  return matches;
}

function extractContent(html: string, selector?: string): string {
  // Basic content extraction - in a real implementation, use proper DOM parsing
  if (selector) {
    // Simple selector matching for demonstration
    const regex = new RegExp(`<[^>]*class=[^>]*${selector}[^>]*>(.*?)</[^>]*>`, 'gis');
    const match = html.match(regex);
    return match ? match[1].replace(/<[^>]*>/g, '').trim() : '';
  }
  
  // Extract main content by removing scripts, styles, and tags
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
} 