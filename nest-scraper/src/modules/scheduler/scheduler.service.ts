import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { ScraperService } from '../scraper/scraper.service';
import { UrlDiscoveryService } from '../url-discovery/url-discovery.service';
import { ContentComparisonService } from '../content-comparison/content-comparison.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private isScrapingActive = false;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly scraperService: ScraperService,
    private readonly urlDiscoveryService: UrlDiscoveryService,
    private readonly contentComparisonService: ContentComparisonService,
    private readonly configService: ConfigService,
  ) {}

  // Run URL discovery every 6 hours
  @Cron(CronExpression.EVERY_6_HOURS)
  async performUrlDiscovery(): Promise<void> {
    if (this.isScrapingActive) {
      this.logger.warn('Scraping is already active, skipping URL discovery');
      return;
    }

    this.logger.log('Starting scheduled URL discovery');

    try {
      await this.urlDiscoveryService.analyzeExistingUrls();
      this.logger.log('URL discovery completed successfully');
    } catch (error) {
      this.logger.error('Error during URL discovery:', error);
    }
  }

  // Run content scraping every 2 hours
  @Cron(CronExpression.EVERY_2_HOURS)
  async performContentScraping(): Promise<void> {
    if (this.isScrapingActive) {
      this.logger.warn('Scraping is already active, skipping content scraping');
      return;
    }

    this.isScrapingActive = true;
    this.logger.log('Starting scheduled content scraping');

    try {
      // Get all active discovered URLs from active base URLs
      const activeDiscoveredUrls = await this.supabaseService.getAllActiveDiscoveredUrls();
      this.logger.log(`Found ${activeDiscoveredUrls.length} active discovered URLs to scrape`);

      let successCount = 0;
      let errorCount = 0;

      for (const discoveredUrl of activeDiscoveredUrls) {
        try {
          this.logger.log(`Scraping: ${discoveredUrl.url}`);

          // Create scraping job
          const scrapingJob = await this.supabaseService.createScrapingJob({
            infoUrlId: discoveredUrl.id,
            status: 'running',
            startedAt: new Date(),
            retryCount: 0,
          });

          // Perform scraping
          const result = await this.scraperService.scrapeWithRetry(discoveredUrl.url, 3);

          if (result.success && result.content) {
            // Check for content changes
            const changeResult = await this.contentComparisonService.compareAndDetectChanges(
              discoveredUrl.id,
              result.content,
              result.metadata
            );

            if (changeResult.hasChanges) {
              this.logger.log(`Content changes detected for: ${discoveredUrl.url}`);
              
              // Here you could trigger alerts to the MCP server
              await this.notifyMcpServer(discoveredUrl, changeResult);
            }

            // Update scraping job as completed
            await this.supabaseService.updateScrapingJob(scrapingJob.id, {
              status: 'completed',
              completedAt: new Date(),
            });

            // Update discovered URL last scraped time (if this column exists)
            try {
              await this.supabaseService.updateInfoUrl(discoveredUrl.id, {
                lastScraped: new Date(),
              });
            } catch (updateError) {
              this.logger.warn(`Could not update lastScraped for ${discoveredUrl.id}:`, updateError);
            }

            successCount++;
          } else {
            // Update scraping job as failed
            await this.supabaseService.updateScrapingJob(scrapingJob.id, {
              status: 'failed',
              completedAt: new Date(),
              error: result.error,
            });

            this.logger.error(`Failed to scrape ${discoveredUrl.url}: ${result.error}`);
            errorCount++;
          }

          // Add delay between requests to be respectful
          await this.delay(2000);

        } catch (error) {
          this.logger.error(`Error scraping ${discoveredUrl.url}:`, error);
          errorCount++;
        }
      }

      this.logger.log(`Content scraping completed. Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
      this.logger.error('Error during content scraping:', error);
    } finally {
      this.isScrapingActive = false;
    }
  }

  // Clean up old data every day at 2 AM
  @Cron('0 2 * * *')
  async performDataCleanup(): Promise<void> {
    this.logger.log('Starting scheduled data cleanup');

    try {
      // This would implement cleanup logic for old scraped content
      // For now, just log that it would happen
      this.logger.log('Data cleanup would be performed here (not implemented yet)');
    } catch (error) {
      this.logger.error('Error during data cleanup:', error);
    }
  }

  // Health check every 30 minutes
  @Cron(CronExpression.EVERY_30_MINUTES)
  async performHealthCheck(): Promise<void> {
    try {
      const browserHealth = await this.scraperService.healthCheck();
      
      if (!browserHealth) {
        this.logger.error('Browser health check failed');
        // Here you could implement alerting or restart logic
      } else {
        this.logger.debug('Browser health check passed');
      }
    } catch (error) {
      this.logger.error('Error during health check:', error);
    }
  }

  private async notifyMcpServer(infoUrl: any, changeResult: any): Promise<void> {
    try {
      // Import axios dynamically to avoid circular dependencies
      const axios = (await import('axios')).default;
      
      const mcpServerUrl = this.configService.get<string>('MCP_SERVER_URL') || 'http://localhost:8081';
      
      this.logger.log('🔗 Calling MCP Bridge for AI analysis', {
        url: infoUrl.url,
        hasChanges: changeResult.hasChanges,
        mcpServerUrl
      });

      // Get the current and previous content for AI analysis
      const currentContent = changeResult.newContent || '';
      const previousContent = changeResult.previousContent || '';

      // Call the MCP Bridge AI analysis endpoint
      const response = await axios.post(`${mcpServerUrl}/ai-analysis`, {
        content: currentContent,
        previousContent: previousContent,
        url: infoUrl.url,
        infoUrlId: infoUrl.id
      }, {
        timeout: 30000, // 30 second timeout for AI analysis
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        this.logger.log('🤖 AI Analysis completed successfully', {
          source: response.data.source,
          hasLocationInfo: response.data.hasLocationInfo,
          confidence: response.data.confidence,
          locationsFound: response.data.locations?.length || 0,
          changesDetected: response.data.changes?.length || 0
        });

        // If high-confidence location information was found, log it
        if (response.data.hasLocationInfo && response.data.confidence > 0.7) {
          this.logger.log('🎯 High-confidence location data detected!', {
            summary: response.data.summary,
            locations: response.data.locations
          });
        }

        // If changes were detected by AI, log them
        if (response.data.changes && response.data.changes.length > 0) {
          this.logger.log('🔄 AI detected content changes:', {
            changes: response.data.changes
          });
        }
      } else {
        this.logger.warn('🤖 AI Analysis failed', {
          error: response.data.error
        });
      }

    } catch (error) {
      this.logger.error('❌ Failed to call MCP Bridge for AI analysis', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: infoUrl?.url
      });
      
      // Don't throw the error - we don't want to break the scraping process
      // if AI analysis fails
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual trigger methods for testing
  async triggerUrlDiscovery(): Promise<void> {
    this.logger.log('Manually triggering URL discovery');
    await this.performUrlDiscovery();
  }

  async triggerContentScraping(): Promise<void> {
    if (this.isScrapingActive) {
      this.logger.warn('Scraping is already active, skipping manual trigger');
      return;
    }

    this.isScrapingActive = true;
    this.logger.log('Manually triggering content scraping');

    try {
      // Get all active discovered URLs from active base URLs
      const activeDiscoveredUrls = await this.supabaseService.getAllActiveDiscoveredUrls();
      this.logger.log(`Found ${activeDiscoveredUrls.length} active discovered URLs to scrape`);

      let successCount = 0;
      let errorCount = 0;

      for (const discoveredUrl of activeDiscoveredUrls) {
        try {
          this.logger.log(`Scraping: ${discoveredUrl.url}`);
          
          const result = await this.scraperService.scrapeWithRetry(discoveredUrl.url, 3);

          if (result.success && result.content) {
            const changeResult = await this.contentComparisonService.compareAndDetectChanges(
              discoveredUrl.id,
              result.content,
              result.metadata
            );

            if (changeResult.hasChanges) {
              this.logger.log(`Content changes detected for: ${discoveredUrl.url}`);
              await this.notifyMcpServer(discoveredUrl, changeResult);
            }

            successCount++;
          } else {
            this.logger.error(`Failed to scrape ${discoveredUrl.url}: ${result.error}`);
            errorCount++;
          }

          // Add delay between requests
          await this.delay(2000);

        } catch (error) {
          this.logger.error(`Error scraping ${discoveredUrl.url}:`, error);
          errorCount++;
        }
      }

      this.logger.log(`Manual content scraping completed. Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
      this.logger.error('Error during manual content scraping:', error);
    } finally {
      this.isScrapingActive = false;
    }
  }

  async triggerSingleUrlScraping(discoveredUrlId: string): Promise<void> {
    this.logger.log(`Manually triggering scraping for discovered URL: ${discoveredUrlId}`);

    try {
      const allDiscoveredUrls = await this.supabaseService.getAllActiveDiscoveredUrls();
      const targetUrl = allDiscoveredUrls.find(url => url.id === discoveredUrlId);

      if (!targetUrl) {
        throw new Error(`Discovered URL with ID ${discoveredUrlId} not found`);
      }

      this.logger.log(`Found target URL: ${targetUrl.url}`);

      const result = await this.scraperService.scrapeWithRetry(targetUrl.url, 3);

      if (result.success && result.content) {
        this.logger.log(`Successfully scraped ${targetUrl.url}, content length: ${result.content.length}`);
        
        const changeResult = await this.contentComparisonService.compareAndDetectChanges(
          targetUrl.id,
          result.content,
          result.metadata
        );

        if (changeResult.hasChanges) {
          this.logger.log(`Content changes detected for: ${targetUrl.url}`);
          await this.notifyMcpServer(targetUrl, changeResult);
        }

        // Try to update last scraped time if the column exists
        try {
          await this.supabaseService.updateInfoUrl(targetUrl.id, {
            lastScraped: new Date(),
          });
        } catch (updateError) {
          this.logger.warn(`Could not update lastScraped for ${targetUrl.id}:`, updateError);
        }
      } else {
        this.logger.error(`Failed to scrape ${targetUrl.url}: ${result.error}`);
        throw new Error(result.error || 'Scraping failed');
      }
    } catch (error) {
      this.logger.error(`Error in manual scraping for ${discoveredUrlId}:`, error);
      throw error;
    }
  }

  getScrapingStatus(): { isActive: boolean } {
    return { isActive: this.isScrapingActive };
  }
} 