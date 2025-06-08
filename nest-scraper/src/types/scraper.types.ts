export interface BaseUrl {
  id: string;
  url: string;
  domain: string;
  status: 'active' | 'inactive' | 'failed';
  lastChecked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InfoUrl {
  id: string;
  baseUrlId: string;
  url: string;
  pageType: 'sitemap' | 'locations' | 'store-locator' | 'other';
  status: 'active' | 'inactive' | 'failed';
  lastScraped?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapedContent {
  id: string;
  infoUrlId: string;
  content: string;
  contentHash: string;
  metadata?: Record<string, unknown>;
  scrapedAt: Date;
}

export interface ContentChange {
  id: string;
  infoUrlId: string;
  previousContentHash: string;
  newContentHash: string;
  changeType: 'new_content' | 'modified_content' | 'removed_content';
  detectedAt: Date;
  processed: boolean;
}

export interface ScrapingJob {
  id: string;
  infoUrlId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
}

export interface ScrapingResult {
  success: boolean;
  content?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  contentHash?: string;
  changeDetected?: boolean;
} 