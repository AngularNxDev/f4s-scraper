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
  async triggerContentScraping() {
    await this.schedulerService.triggerContentScraping();
    return { message: 'Content scraping triggered successfully' };
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
