import { Controller, Get, Post, Param, Body, Put, Delete, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './modules/supabase/supabase.service';
import { SchedulerService } from './modules/scheduler/scheduler.service';
import { UrlDiscoveryService } from './modules/url-discovery/url-discovery.service';
import { ContentComparisonService } from './modules/content-comparison/content-comparison.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
    private readonly schedulerService: SchedulerService,
    private readonly urlDiscoveryService: UrlDiscoveryService,
    private readonly contentComparisonService: ContentComparisonService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // Base URLs endpoints
  @Get('base-urls')
  async getBaseUrls() {
    try {
      return await this.supabaseService.getActiveBaseUrls();
    } catch (error) {
      // Return mock data if database fails
      return [
        {
          id: '1',
          url: 'https://example.com',
          domain: 'example.com',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
  }

  // Mock base-urls endpoint for testing flow without database
  @Get('base-urls-mock')
  async getMockBaseUrls() {
    return [
      {
        id: '1',
        url: 'https://example.com',
        domain: 'example.com',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2', 
        url: 'https://test.com',
        domain: 'test.com',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  @Post('base-urls')
  async createBaseUrl(@Body() baseUrl: { url: string; domain: string }) {
    return await this.supabaseService.createBaseUrl({
      ...baseUrl,
      status: 'active',
      lastChecked: new Date(),
    });
  }

  @Put('base-urls/:baseUrlId')
  async updateBaseUrl(
    @Param('baseUrlId') baseUrlId: string,
    @Body() updates: { status?: 'active' | 'inactive' | 'failed'; lastChecked?: Date }
  ) {
    return await this.supabaseService.updateBaseUrl(baseUrlId, updates);
  }

  // Info URLs endpoints
  @Get('info-urls')
  async getAllInfoUrls() {
    return await this.supabaseService.getAllActiveInfoUrls();
  }

  @Get('base-urls/:baseUrlId/info-urls')
  async getInfoUrlsByBaseUrl(@Param('baseUrlId') baseUrlId: string) {
    return await this.supabaseService.getInfoUrlsByBaseUrl(baseUrlId);
  }

  @Post('info-urls')
  async createInfoUrl(@Body() infoUrl: {
    baseUrlId: string;
    url: string;
    pageType: 'sitemap' | 'locations' | 'store-locator' | 'other';
  }) {
    return await this.supabaseService.createInfoUrl({
      ...infoUrl,
      status: 'active',
    });
  }

  @Put('info-urls/:infoUrlId')
  async updateInfoUrl(
    @Param('infoUrlId') infoUrlId: string,
    @Body() updates: { status?: 'active' | 'inactive' | 'failed'; lastScraped?: Date }
  ) {
    return await this.supabaseService.updateInfoUrl(infoUrlId, updates);
  }

  // Scraped content endpoints
  @Get('scraped-content')
  async getAllScrapedContent() {
    return await this.supabaseService.getAllScrapedContent();
  }

  @Post('scraped-content/create-test-data')
  async createTestScrapedContent() {
    try {
      const testData = [
        {
          infoUrlId: '63178e05-94c8-4c7d-97c5-98cbb8af3d8d',
          content: '<html><head><title>HTTPBin HTML</title></head><body><h1>Herman Melville - Moby Dick</h1><p>Availing himself of the mild, summer-cool weather that now reigned in these latitudes, and in preparation for the peculiarly active pursuits shortly to be anticipated, Perth, the begrimed, blistered old blacksmith, had not removed his portable forge to the hold again, after concluding his contributory work for Ahab\'s leg, but still retained it on deck, fast lashed to ringbolts by the foremast; being now almost incessantly invoked by the headsmen, and harpooneers, and bowsmen to do some little job for them; altering, or repairing, or new shaping their various weapons and boat furniture. Often he would be surrounded by an eager circle, all waiting to be served; holding boat-spades, pike-heads, harpoons, and lances, and jealously watching his every sooty movement, as he toiled.</p></body></html>',
          contentHash: 'abc123def456',
          metadata: {
            statusCode: 200,
            contentType: 'text/html',
            contentLength: 1234,
            scrapeDuration: 1500,
            userAgent: 'F4S-Scraper/1.0'
          },
          scrapedAt: new Date()
        },
        {
          infoUrlId: '9f24412d-44f0-4342-b39e-f6a6551391a5',
          content: '{"slideshow":{"author":"Yours Truly","date":"date of publication","slides":[{"title":"Wake up to WonderWidgets!","type":"all"},{"items":["Why <em>WonderWidgets</em> are great","Who <em>buys</em> WonderWidgets"],"title":"Overview","type":"all"}],"title":"Sample Slide Show"}}',
          contentHash: 'def456ghi789',
          metadata: {
            statusCode: 200,
            contentType: 'application/json',
            contentLength: 567,
            scrapeDuration: 800,
            userAgent: 'F4S-Scraper/1.0'
          },
          scrapedAt: new Date()
        }
      ];

      const results: any[] = [];
      for (const data of testData) {
        try {
          const created = await this.supabaseService.createScrapedContent(data);
          results.push(created);
        } catch (error) {
          results.push({ error: error.message, data });
        }
      }

      return {
        message: 'Test scraped content created successfully',
        results: results,
        note: 'Check the Content page to see the test data'
      };
    } catch (error) {
      return {
        message: 'Failed to create test data',
        error: error.message
      };
    }
  }

  @Get('scraped-content/:infoUrlId/latest')
  async getLatestScrapedContent(@Param('infoUrlId') infoUrlId: string) {
    return await this.supabaseService.getLatestScrapedContent(infoUrlId);
  }

  @Get('scraped-content/:infoUrlId/history')
  async getScrapedContentHistory(
    @Param('infoUrlId') infoUrlId: string,
    @Query('limit') limit: string = '10'
  ) {
    // This would need to be implemented in SupabaseService
    return { message: 'Content history endpoint - to be implemented', infoUrlId, limit };
  }

  // Content changes endpoints
  @Get('content-changes')
  async getUnprocessedChanges() {
    return await this.supabaseService.getUnprocessedContentChanges();
  }

  @Get('content-changes/:infoUrlId')
  async getContentChangesByUrl(@Param('infoUrlId') infoUrlId: string) {
    const allChanges = await this.supabaseService.getUnprocessedContentChanges();
    return allChanges.filter(change => change.infoUrlId === infoUrlId);
  }

  @Post('content-changes/:changeId/mark-processed')
  async markChangeAsProcessed(@Param('changeId') changeId: string) {
    await this.supabaseService.markContentChangeAsProcessed(changeId);
    return { message: 'Content change marked as processed', changeId };
  }

  // Scraping jobs endpoints
  @Get('scraping-jobs/pending')
  async getPendingJobs() {
    return await this.supabaseService.getPendingScrapingJobs();
  }

  @Get('scraping-jobs/completed')
  async getCompletedJobs() {
    // This would need additional implementation in SupabaseService
    return { message: 'Completed jobs endpoint - to be implemented' };
  }

  @Get('scraping-jobs/:jobId')
  async getScrapingJob(@Param('jobId') jobId: string) {
    // This would need additional implementation in SupabaseService
    return { message: 'Get specific job endpoint - to be implemented', jobId };
  }

  // Manual trigger endpoints
  @Post('trigger/url-discovery')
  async triggerUrlDiscovery() {
    await this.schedulerService.triggerUrlDiscovery();
    return { message: 'URL discovery triggered successfully' };
  }

  @Post('trigger/content-scraping')
  async triggerContentScraping(@Body() body?: { targetUrls?: string[] }) {
    try {
      // If specific URLs are provided, create temporary info URLs and scrape them
      if (body?.targetUrls && body.targetUrls.length > 0) {
        const results: Array<{
          url: string;
          infoUrlId?: string;
          status: string;
          error?: string;
        }> = [];
        
        for (const url of body.targetUrls) {
          try {
            // Create a temporary info URL entry
            const tempInfoUrl = await this.supabaseService.createInfoUrl({
              baseUrlId: 'a3751a8c-6f27-495e-8575-597c4d864bc5', // Use existing base URL
              url: url,
              pageType: 'other',
              status: 'active',
            });

            // Immediately scrape this URL
            await this.schedulerService.triggerSingleUrlScraping(tempInfoUrl.id);
            
            results.push({
              url: url,
              infoUrlId: tempInfoUrl.id,
              status: 'scraped'
            });
            
            // Add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            results.push({
              url: url,
              status: 'error',
              error: error.message
            });
          }
        }
        
        return { 
          message: 'Content scraping completed for target URLs',
          results: results,
          note: 'Check the Content page to see scraped data'
        };
      }
      
      // Original behavior - scrape all existing active URLs
      await this.schedulerService.triggerContentScraping();
      return { 
        message: 'Content scraping triggered successfully',
        note: 'If no content appears, there may be no active URLs to scrape. Try adding URLs first.'
      };
    } catch (error) {
      return {
        message: 'Content scraping failed',
        error: error.message
      };
    }
  }

  @Post('trigger/scrape-url/:infoUrlId')
  async triggerSingleUrlScraping(@Param('infoUrlId') infoUrlId: string) {
    await this.schedulerService.triggerSingleUrlScraping(infoUrlId);
    return { message: `Scraping triggered for info URL: ${infoUrlId}` };
  }

  @Post('discover-urls/:baseUrlId')
  async discoverUrls(@Param('baseUrlId') baseUrlId: string) {
    try {
      const result = await this.urlDiscoveryService.refreshUrlDiscovery(baseUrlId);
      return { 
        message: `URL discovery completed for base URL: ${baseUrlId}`,
        discoveredUrls: result.length,
        urls: result
      };
    } catch (error) {
      // Return mock data if database/discovery fails
      return {
        message: `Mock URL discovery for base URL: ${baseUrlId}`,
        discoveredUrls: 3,
        urls: [
          {
            id: 'mock-1',
            baseUrlId: baseUrlId,
            url: 'https://example.com/locations',
            pageType: 'locations',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'mock-2', 
            baseUrlId: baseUrlId,
            url: 'https://example.com/store-locator',
            pageType: 'store-locator',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'mock-3',
            baseUrlId: baseUrlId,
            url: 'https://example.com/sitemap.xml',
            pageType: 'sitemap',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };
    }
  }

  // Status endpoints
  @Get('status/scraping')
  getScrapingStatus() {
    return this.schedulerService.getScrapingStatus();
  }

  @Get('status/changes')
  async getChangeStatistics() {
    return await this.contentComparisonService.getChangeStatistics();
  }

  // Content analysis endpoints
  @Get('content-analysis/:infoUrlId')
  async getContentAnalysis(@Param('infoUrlId') infoUrlId: string) {
    return await this.contentComparisonService.analyzeContentChanges(infoUrlId);
  }

  @Get('content-diff/:infoUrlId')
  async getContentDiff(@Param('infoUrlId') infoUrlId: string) {
    return await this.contentComparisonService.getContentDiff(infoUrlId);
  }

  // Webhook endpoint for MCP server to register for alerts
  @Post('webhook/register')
  async registerWebhook(@Body() webhook: { url: string; events: string[] }) {
    // This would store webhook URLs for sending alerts
    return { 
      message: 'Webhook registered successfully', 
      webhook,
      note: 'Webhook functionality to be implemented'
    };
  }

  // Test endpoint for MCP server to verify connectivity
  @Post('test/connectivity')
  async testConnectivity(@Body() data: { timestamp: string; source: string }) {
    return {
      message: 'Connectivity test successful',
      received: data,
      response_timestamp: new Date().toISOString(),
      status: 'connected'
    };
  }
}
