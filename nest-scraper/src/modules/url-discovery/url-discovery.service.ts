import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ScraperService } from '../scraper/scraper.service';
import { BaseUrl, InfoUrl } from '../../types/scraper.types';
import * as crypto from 'crypto';

@Injectable()
export class UrlDiscoveryService {
  private readonly logger = new Logger(UrlDiscoveryService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly scraperService: ScraperService,
  ) {}

  async discoverInfoUrls(baseUrl: BaseUrl): Promise<InfoUrl[]> {
    this.logger.log(`Starting URL discovery for: ${baseUrl.url}`);

    const discoveredUrls: InfoUrl[] = [];

    try {
      // 1. Try to find sitemap.xml
      const sitemapUrls = await this.findSitemaps(baseUrl);
      discoveredUrls.push(...sitemapUrls);

      // 2. Try to find location pages by common patterns
      const locationUrls = await this.findLocationPages(baseUrl);
      discoveredUrls.push(...locationUrls);

      // 3. Try to find store locator pages
      const storeLocatorUrls = await this.findStoreLocatorPages(baseUrl);
      discoveredUrls.push(...storeLocatorUrls);

      this.logger.log(`Discovered ${discoveredUrls.length} URLs for ${baseUrl.url}`);

      // Save discovered URLs to database
      for (const infoUrl of discoveredUrls) {
        try {
          await this.supabaseService.createInfoUrl(infoUrl);
        } catch (error) {
          this.logger.warn(`Failed to save discovered URL: ${infoUrl.url}`, error);
        }
      }

      return discoveredUrls;

    } catch (error) {
      this.logger.error(`Error during URL discovery for ${baseUrl.url}:`, error);
      return [];
    }
  }

  private async findSitemaps(baseUrl: BaseUrl): Promise<InfoUrl[]> {
    const potentialSitemaps = [
      '/sitemap.xml',
      '/sitemap_index.xml',
      '/sitemaps.xml',
      '/robots.txt', // Can contain sitemap references
    ];

    const discoveredSitemaps: InfoUrl[] = [];

    for (const sitemapPath of potentialSitemaps) {
      const sitemapUrl = this.combineUrl(baseUrl.url, sitemapPath);
      
      try {
        const result = await this.scraperService.scrapeUrl(sitemapUrl);
        
        if (result.success) {
          this.logger.log(`Found sitemap: ${sitemapUrl}`);
          
          discoveredSitemaps.push({
            id: this.generateId(),
            baseUrlId: baseUrl.id,
            url: sitemapUrl,
            pageType: 'sitemap',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // If it's robots.txt, parse it for sitemap references
          if (sitemapPath === '/robots.txt' && result.content) {
            const additionalSitemaps = this.extractSitemapsFromRobots(result.content, baseUrl);
            discoveredSitemaps.push(...additionalSitemaps);
          }
        }
      } catch (error) {
        this.logger.debug(`Sitemap not found at: ${sitemapUrl}`);
      }
    }

    return discoveredSitemaps;
  }

  private async findLocationPages(baseUrl: BaseUrl): Promise<InfoUrl[]> {
    const locationPatterns = [
      '/locations',
      '/stores',
      '/branches',
      '/find-us',
      '/find-a-store',
      '/store-finder',
      '/our-locations',
      '/gym-locations',
      '/fitness-centers',
      '/clubs',
      '/centers',
    ];

    const discoveredPages: InfoUrl[] = [];

    for (const pattern of locationPatterns) {
      const pageUrl = this.combineUrl(baseUrl.url, pattern);
      
      try {
        const result = await this.scraperService.scrapeUrl(pageUrl);
        
        if (result.success && result.content) {
          // Check if the page content indicates it's a location page
          if (this.isLocationPage(result.content)) {
            this.logger.log(`Found location page: ${pageUrl}`);
            
            discoveredPages.push({
              id: this.generateId(),
              baseUrlId: baseUrl.id,
              url: pageUrl,
              pageType: 'locations',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      } catch (error) {
        this.logger.debug(`Location page not found at: ${pageUrl}`);
      }
    }

    return discoveredPages;
  }

  private async findStoreLocatorPages(baseUrl: BaseUrl): Promise<InfoUrl[]> {
    const storeLocatorPatterns = [
      '/store-locator',
      '/find-store',
      '/locator',
      '/store-finder',
      '/find-location',
      '/nearest-store',
    ];

    const discoveredPages: InfoUrl[] = [];

    for (const pattern of storeLocatorPatterns) {
      const pageUrl = this.combineUrl(baseUrl.url, pattern);
      
      try {
        const result = await this.scraperService.scrapeUrl(pageUrl);
        
        if (result.success && result.content) {
          // Check if the page content indicates it's a store locator
          if (this.isStoreLocatorPage(result.content)) {
            this.logger.log(`Found store locator page: ${pageUrl}`);
            
            discoveredPages.push({
              id: this.generateId(),
              baseUrlId: baseUrl.id,
              url: pageUrl,
              pageType: 'store-locator',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      } catch (error) {
        this.logger.debug(`Store locator page not found at: ${pageUrl}`);
      }
    }

    return discoveredPages;
  }

  private extractSitemapsFromRobots(robotsContent: string, baseUrl: BaseUrl): InfoUrl[] {
    const sitemapLines = robotsContent
      .split('\n')
      .filter(line => line.toLowerCase().startsWith('sitemap:'))
      .map(line => line.substring(8).trim());

    return sitemapLines.map(sitemapUrl => ({
      id: this.generateId(),
      baseUrlId: baseUrl.id,
      url: sitemapUrl,
      pageType: 'sitemap' as const,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  private isLocationPage(content: string): boolean {
    const locationKeywords = [
      'location', 'address', 'store', 'branch', 'gym', 'fitness center',
      'find us', 'visit us', 'contact', 'directions', 'hours', 'opening times'
    ];

    const lowerContent = content.toLowerCase();
    const keywordMatches = locationKeywords.filter(keyword => 
      lowerContent.includes(keyword)
    ).length;

    // If we find multiple location-related keywords, it's likely a location page
    return keywordMatches >= 3;
  }

  private isStoreLocatorPage(content: string): boolean {
    const storeLocatorKeywords = [
      'store locator', 'find store', 'search location', 'enter zip',
      'enter postal code', 'map', 'distance', 'nearest', 'nearby'
    ];

    const lowerContent = content.toLowerCase();
    return storeLocatorKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private combineUrl(baseUrl: string, path: string): string {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const pathname = path.startsWith('/') ? path : '/' + path;
    return base + pathname;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  async analyzeExistingUrls(): Promise<void> {
    this.logger.log('Starting analysis of existing URLs');

    const baseUrls = await this.supabaseService.getActiveBaseUrls();

    for (const baseUrl of baseUrls) {
      try {
        const existingInfoUrls = await this.supabaseService.getInfoUrlsByBaseUrl(baseUrl.id);
        
        if (existingInfoUrls.length === 0) {
          this.logger.log(`No info URLs found for ${baseUrl.url}, starting discovery`);
          await this.discoverInfoUrls(baseUrl);
        } else {
          this.logger.log(`Found ${existingInfoUrls.length} existing info URLs for ${baseUrl.url}`);
        }
      } catch (error) {
        this.logger.error(`Error analyzing URLs for ${baseUrl.url}:`, error);
      }
    }
  }

  async refreshUrlDiscovery(baseUrlId: string): Promise<InfoUrl[]> {
    const baseUrl = await this.supabaseService.getActiveBaseUrls();
    const targetBaseUrl = baseUrl.find(url => url.id === baseUrlId);

    if (!targetBaseUrl) {
      throw new Error(`Base URL with ID ${baseUrlId} not found`);
    }

    // Mark existing info URLs as inactive
    const existingInfoUrls = await this.supabaseService.getInfoUrlsByBaseUrl(baseUrlId);
    for (const infoUrl of existingInfoUrls) {
      await this.supabaseService.updateInfoUrl(infoUrl.id, { status: 'inactive' });
    }

    // Discover new URLs
    return await this.discoverInfoUrls(targetBaseUrl);
  }
} 