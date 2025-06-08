import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  BaseUrl,
  InfoUrl,
  ScrapedContent,
  ContentChange,
  ScrapingJob,
} from '../../types/scraper.types';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase client initialized');
  }

  // Base URLs operations
  async getActiveBaseUrls(): Promise<BaseUrl[]> {
    const { data, error } = await this.supabase
      .from('base_urls')
      .select('*')
      .eq('is_active', true);

    if (error) {
      this.logger.error('Error fetching base URLs:', error);
      throw error;
    }

    return data || [];
  }

  async createBaseUrl(baseUrl: Omit<BaseUrl, 'id' | 'createdAt' | 'updatedAt'>): Promise<BaseUrl> {
    const { data, error } = await this.supabase
      .from('base_urls')
      .insert([{
        url: baseUrl.url,
        domain: baseUrl.domain,
        status: baseUrl.status,
        last_checked: baseUrl.lastChecked
      }])
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating base URL:', error);
      throw error;
    }

    return data;
  }

  async updateBaseUrl(id: string, updates: Partial<BaseUrl>): Promise<BaseUrl> {
    const updateData: any = { updated_at: new Date() };
    if (updates.status) updateData.status = updates.status;
    if (updates.lastChecked) updateData.last_checked = updates.lastChecked;
    if (updates.url) updateData.url = updates.url;
    if (updates.domain) updateData.domain = updates.domain;
    
    const { data, error } = await this.supabase
      .from('base_urls')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating base URL:', error);
      throw error;
    }

    return data;
  }

  // Info URLs operations
  async getInfoUrlsByBaseUrl(baseUrlId: string): Promise<InfoUrl[]> {
    const { data, error } = await this.supabase
      .from('info_urls')
      .select('*')
      .eq('baseUrlId', baseUrlId)
      .eq('status', 'active');

    if (error) {
      this.logger.error('Error fetching info URLs:', error);
      throw error;
    }

    return data || [];
  }

  async getAllActiveInfoUrls(): Promise<InfoUrl[]> {
    const { data, error } = await this.supabase
      .from('info_urls')
      .select('*')
      .eq('status', 'active');

    if (error) {
      this.logger.error('Error fetching active info URLs:', error);
      throw error;
    }

    if (!data) return [];

    // Convert database response to TypeScript format
    return data.map(item => ({
      id: item.id,
      baseUrlId: item.base_url_id,
      url: item.url,
      pageType: item.page_type,
      status: item.status,
      lastScraped: item.last_scraped ? new Date(item.last_scraped) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  }

  async createInfoUrl(infoUrl: Omit<InfoUrl, 'id' | 'createdAt' | 'updatedAt'>): Promise<InfoUrl> {
    const { data, error } = await this.supabase
      .from('info_urls')
      .insert([infoUrl])
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating info URL:', error);
      throw error;
    }

    return data;
  }

  async updateInfoUrl(id: string, updates: Partial<InfoUrl>): Promise<InfoUrl> {
    const { data, error } = await this.supabase
      .from('info_urls')
      .update({ ...updates, updatedAt: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating info URL:', error);
      throw error;
    }

    return data;
  }

  // Scraped content operations
  async getAllScrapedContent(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('scraped_content')
      .select('*')
      .order('scraped_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching all scraped content:', error);
      throw error;
    }

    return data || [];
  }

  async getLatestScrapedContent(infoUrlId: string): Promise<ScrapedContent | null> {
    const { data, error } = await this.supabase
      .from('scraped_content')
      .select('*')
      .eq('discovered_url_id', infoUrlId)
      .order('scraped_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      this.logger.error('Error fetching latest scraped content:', error);
      throw error;
    }

    if (!data) return null;

    // Convert database response to TypeScript format
    return {
      id: data.id,
      infoUrlId: data.discovered_url_id,
      content: data.content,
      contentHash: data.content_hash,
      metadata: data.metadata,
      scrapedAt: new Date(data.scraped_at)
    };
  }

  async createScrapedContent(content: Omit<ScrapedContent, 'id'>): Promise<ScrapedContent> {
    this.logger.debug('Creating scraped content:', {
      infoUrlId: content.infoUrlId,
      contentLength: content.content.length,
      contentHash: content.contentHash,
      hasMetadata: !!content.metadata
    });

    // Validate that contentHash is not null or empty
    if (!content.contentHash || content.contentHash.trim() === '') {
      this.logger.error('Content hash is null or empty, generating new hash');
      const crypto = require('crypto');
      content.contentHash = crypto.createHash('sha256').update(content.content || '').digest('hex');
      this.logger.debug('Generated fallback content hash:', content.contentHash);
    }

    // Map TypeScript camelCase to database snake_case explicitly
    const dbContent = {
      discovered_url_id: content.infoUrlId,
      content: content.content,
      content_hash: content.contentHash,
      metadata: content.metadata || {},
      scraped_at: content.scrapedAt instanceof Date ? content.scrapedAt.toISOString() : content.scrapedAt
    };

    this.logger.debug('Database payload:', dbContent);

    const { data, error } = await this.supabase
      .from('scraped_content')
      .insert([dbContent])
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating scraped content:', error);
      this.logger.error('Failed database payload:', dbContent);
      throw error;
    }

    // Convert response back to TypeScript format
    return {
      id: data.id,
      infoUrlId: data.discovered_url_id,
      content: data.content,
      contentHash: data.content_hash,
      metadata: data.metadata,
      scrapedAt: new Date(data.scraped_at)
    };
  }

  // Content changes operations
  async createContentChange(change: Omit<ContentChange, 'id'>): Promise<ContentChange> {
    // Map TypeScript camelCase to database snake_case explicitly
    const dbChange = {
      info_url_id: change.infoUrlId,
      previous_content_hash: change.previousContentHash,
      new_content_hash: change.newContentHash,
      change_type: change.changeType,
      detected_at: change.detectedAt instanceof Date ? change.detectedAt.toISOString() : change.detectedAt,
      processed: change.processed
    };

    const { data, error } = await this.supabase
      .from('content_changes')
      .insert([dbChange])
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating content change:', error);
      this.logger.error('Failed database payload:', dbChange);
      throw error;
    }

    // Convert response back to TypeScript format
    return {
      id: data.id,
      infoUrlId: data.info_url_id,
      previousContentHash: data.previous_content_hash,
      newContentHash: data.new_content_hash,
      changeType: data.change_type,
      detectedAt: new Date(data.detected_at),
      processed: data.processed
    };
  }

  async getUnprocessedContentChanges(): Promise<ContentChange[]> {
    const { data, error } = await this.supabase
      .from('content_changes')
      .select('*')
      .eq('processed', false)
      .order('detected_at', { ascending: true });

    if (error) {
      this.logger.error('Error fetching unprocessed content changes:', error);
      throw error;
    }

    if (!data) return [];

    // Convert database response to TypeScript format
    return data.map(item => ({
      id: item.id,
      infoUrlId: item.info_url_id,
      previousContentHash: item.previous_content_hash,
      newContentHash: item.new_content_hash,
      changeType: item.change_type,
      detectedAt: new Date(item.detected_at),
      processed: item.processed
    }));
  }

  async markContentChangeAsProcessed(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('content_changes')
      .update({ processed: true })
      .eq('id', id);

    if (error) {
      this.logger.error('Error marking content change as processed:', error);
      throw error;
    }
  }

  // Scraping jobs operations
  async createScrapingJob(job: Omit<ScrapingJob, 'id'>): Promise<ScrapingJob> {
    const { data, error } = await this.supabase
      .from('scraping_jobs')
      .insert([job])
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating scraping job:', error);
      throw error;
    }

    return data;
  }

  async updateScrapingJob(id: string, updates: Partial<ScrapingJob>): Promise<ScrapingJob> {
    const { data, error } = await this.supabase
      .from('scraping_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating scraping job:', error);
      throw error;
    }

    return data;
  }

  async getPendingScrapingJobs(): Promise<ScrapingJob[]> {
    const { data, error } = await this.supabase
      .from('scraping_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('createdAt', { ascending: true });

    if (error) {
      this.logger.error('Error fetching pending scraping jobs:', error);
      throw error;
    }

    return data || [];
  }

  // New method to get discovered URLs from active base URLs
  async getAllActiveDiscoveredUrls(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('discovered_urls')
      .select(`
        *,
        base_urls!inner (
          id,
          url,
          name,
          status
        )
      `)
      .eq('base_urls.status', 'active');

    if (error) {
      this.logger.error('Error fetching active discovered URLs:', error);
      throw error;
    }

    this.logger.log(`Found ${data?.length || 0} active discovered URLs`);
    return data || [];
  }

  // Create discovered URL
  async createDiscoveredUrl(baseUrlId: string, url: string, pageType = 'other'): Promise<any> {
    const { data, error } = await this.supabase
      .from('discovered_urls')
      .insert([{
        base_url_id: baseUrlId,
        url: url,
        page_type: pageType
      }])
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating discovered URL:', error);
      throw error;
    }

    this.logger.log(`Created discovered URL: ${url} with ID: ${data.id}`);
    return data;
  }
} 