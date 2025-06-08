import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import { SupabaseService } from '../supabase/supabase.service';
import { ScrapingResult } from '../../types/scraper.types';
import * as crypto from 'crypto';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private browser: Browser | null = null;

  constructor(private readonly supabaseService: SupabaseService) {}

  async onModuleInit(): Promise<void> {
    await this.initializeBrowser();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeBrowser();
  }

  private async initializeBrowser(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.logger.log('Browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed');
    }
  }

  private async getPage(): Promise<Page> {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    const context = await this.browser!.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });

    return await context.newPage();
  }

  async scrapeUrl(url: string): Promise<ScrapingResult> {
    const page = await this.getPage();

    try {
      this.logger.log(`Starting to scrape: ${url}`);

      // Navigate to the page with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for the page to be fully loaded
      await page.waitForLoadState('domcontentloaded');

      // Extract page content
      const content = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());

        // Get the main content
        const body = document.body;
        return body ? body.innerText.trim() : '';
      });

      // Extract metadata
      const metadata = await page.evaluate(() => {
        const title = document.title;
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        
        return {
          title,
          description: metaDescription,
          canonicalUrl,
          lastModified: document.lastModified,
        };
      });

      // Generate content hash
      const contentHash = this.generateContentHash(content);

      this.logger.log(`Successfully scraped ${url}. Content length: ${content.length}`);

      return {
        success: true,
        content,
        metadata,
        contentHash,
      };

    } catch (error) {
      this.logger.error(`Error scraping ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error',
      };
    } finally {
      await page.context().close();
    }
  }

  async scrapeSitemap(url: string): Promise<ScrapingResult> {
    const page = await this.getPage();

    try {
      this.logger.log(`Scraping sitemap: ${url}`);

      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Check if it's an XML sitemap or HTML page with links
      const contentType = await page.evaluate(() => {
        return document.contentType || document.querySelector('html')?.getAttribute('xmlns') ? 'xml' : 'html';
      });

      let content: string;
      let metadata: Record<string, unknown>;

      if (contentType === 'xml' || url.includes('.xml')) {
        // Handle XML sitemap
        const xmlContent = await page.content();
        
        // Extract URLs from XML sitemap
        const urls = await page.evaluate(() => {
          const urlElements = document.querySelectorAll('url > loc, urlset > url > loc');
          return Array.from(urlElements).map(el => el.textContent?.trim()).filter(Boolean);
        });

        content = JSON.stringify({ urls, xmlContent });
        metadata = {
          type: 'xml_sitemap',
          urlCount: urls.length,
          extractedUrls: urls,
        };

      } else {
        // Handle HTML page - extract all links
        const links = await page.evaluate(() => {
          const linkElements = document.querySelectorAll('a[href]');
          return Array.from(linkElements).map(el => {
            const anchor = el as HTMLAnchorElement;
            return {
              url: anchor.href,
              text: anchor.textContent?.trim() || '',
            };
          }).filter(link => link.url && !link.url.startsWith('javascript:') && !link.url.startsWith('mailto:'));
        });

        content = JSON.stringify({ links });
        metadata = {
          type: 'html_page',
          linkCount: links.length,
          extractedLinks: links,
        };
      }

      const contentHash = this.generateContentHash(content);

      this.logger.log(`Successfully scraped sitemap ${url}`);

      return {
        success: true,
        content,
        metadata,
        contentHash,
      };

    } catch (error) {
      this.logger.error(`Error scraping sitemap ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sitemap scraping error',
      };
    } finally {
      await page.context().close();
    }
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async scrapeWithRetry(url: string, maxRetries: number = 3): Promise<ScrapingResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.logger.log(`Scraping attempt ${attempt}/${maxRetries} for: ${url}`);

      const result = await this.scrapeUrl(url);

      if (result.success) {
        return result;
      }

      lastError = result.error;

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const page = await this.getPage();
      await page.goto('data:text/html,<html><body>Health Check</body></html>');
      await page.context().close();

      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
} 