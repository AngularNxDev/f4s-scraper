import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ScrapedContent, ContentChange } from '../../types/scraper.types';
import * as crypto from 'crypto';

@Injectable()
export class ContentComparisonService {
  private readonly logger = new Logger(ContentComparisonService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async compareAndDetectChanges(
    infoUrlId: string,
    newContent: string,
    newMetadata?: Record<string, unknown>
  ): Promise<{ 
    hasChanges: boolean; 
    changeType?: string; 
    contentChange?: ContentChange;
    newContent?: string;
    previousContent?: string;
  }> {
    
    // Get the latest scraped content for this URL
    const latestContent = await this.supabaseService.getLatestScrapedContent(infoUrlId);
    
    // Generate hash for new content
    const newContentHash = this.generateContentHash(newContent);

    // If this is the first time scraping this URL
    if (!latestContent) {
      this.logger.log(`First scrape for info URL: ${infoUrlId}`);
      this.logger.debug(`Generated content hash: ${newContentHash}`);
      
      // Save the new content
      const scrapedContent = {
        infoUrlId,
        content: newContent,
        contentHash: newContentHash,
        metadata: newMetadata || {},
        scrapedAt: new Date(),
      };
      
      this.logger.debug('Creating scraped content with:', { 
        infoUrlId: scrapedContent.infoUrlId,
        contentLength: scrapedContent.content.length,
        contentHash: scrapedContent.contentHash,
        hasMetadata: !!scrapedContent.metadata
      });
      
      await this.supabaseService.createScrapedContent(scrapedContent);

      return { 
        hasChanges: false,
        newContent: newContent,
        previousContent: undefined
      };
    }

    // Compare content hashes
    if (latestContent.contentHash === newContentHash) {
      this.logger.debug(`No changes detected for info URL: ${infoUrlId}`);
      return { 
        hasChanges: false,
        newContent: newContent,
        previousContent: latestContent.content
      };
    }

    this.logger.log(`Content changes detected for info URL: ${infoUrlId}`);

    // Determine the type of change
    const changeType = this.determineChangeType(latestContent.content, newContent);

    // Create content change record
    const contentChange = await this.supabaseService.createContentChange({
      infoUrlId,
      previousContentHash: latestContent.contentHash,
      newContentHash,
      changeType,
      detectedAt: new Date(),
      processed: false,
    });

    // Save the new content
    await this.supabaseService.createScrapedContent({
      infoUrlId,
      content: newContent,
      contentHash: newContentHash,
      metadata: newMetadata,
      scrapedAt: new Date(),
    });

    return {
      hasChanges: true,
      changeType,
      contentChange,
      newContent: newContent,
      previousContent: latestContent.content,
    };
  }

  private determineChangeType(oldContent: string, newContent: string): 'new_content' | 'modified_content' | 'removed_content' {
    if (!oldContent && newContent) {
      return 'new_content';
    }

    if (oldContent && !newContent) {
      return 'removed_content';
    }

    return 'modified_content';
  }

  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async analyzeContentChanges(infoUrlId: string): Promise<{
    significantChanges: boolean;
    newLocationsDetected: boolean;
    analysis: string;
  }> {
    const recentChanges = await this.getRecentChanges(infoUrlId, 7); // Last 7 days

    if (recentChanges.length === 0) {
      return {
        significantChanges: false,
        newLocationsDetected: false,
        analysis: 'No recent changes detected',
      };
    }

    // Get the latest content for analysis
    const latestContent = await this.supabaseService.getLatestScrapedContent(infoUrlId);
    
    if (!latestContent) {
      return {
        significantChanges: false,
        newLocationsDetected: false,
        analysis: 'No content available for analysis',
      };
    }

    // Simple keyword-based analysis for location-related changes
    const newLocationsDetected = this.detectNewLocations(latestContent.content);
    const significantChanges = recentChanges.length > 1 || newLocationsDetected;

    const analysis = this.generateAnalysisReport(recentChanges, newLocationsDetected);

    return {
      significantChanges,
      newLocationsDetected,
      analysis,
    };
  }

  private async getRecentChanges(infoUrlId: string, days: number): Promise<ContentChange[]> {
    // This would ideally be a method in SupabaseService, but for now we'll use the existing method
    const allChanges = await this.supabaseService.getUnprocessedContentChanges();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return allChanges.filter(change => 
      change.infoUrlId === infoUrlId && 
      new Date(change.detectedAt) >= cutoffDate
    );
  }

  private detectNewLocations(content: string): boolean {
    const locationIndicators = [
      'new location', 'new store', 'new gym', 'new branch',
      'opening soon', 'now open', 'grand opening',
      'new address', 'relocated', 'moved to'
    ];

    const lowerContent = content.toLowerCase();
    return locationIndicators.some(indicator => lowerContent.includes(indicator));
  }

  private generateAnalysisReport(changes: ContentChange[], newLocationsDetected: boolean): string {
    let report = `Analysis of ${changes.length} recent changes:\n`;

    const changeTypeCounts = changes.reduce((acc, change) => {
      acc[change.changeType] = (acc[change.changeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(changeTypeCounts).forEach(([type, count]) => {
      report += `- ${type}: ${count} occurrences\n`;
    });

    if (newLocationsDetected) {
      report += '- Potential new locations detected in content\n';
    }

    return report;
  }

  async markChangesAsProcessed(infoUrlId: string): Promise<void> {
    const unprocessedChanges = await this.supabaseService.getUnprocessedContentChanges();
    const urlChanges = unprocessedChanges.filter(change => change.infoUrlId === infoUrlId);

    for (const change of urlChanges) {
      await this.supabaseService.markContentChangeAsProcessed(change.id);
    }

    this.logger.log(`Marked ${urlChanges.length} changes as processed for info URL: ${infoUrlId}`);
  }

  async getContentDiff(infoUrlId: string): Promise<{
    previous: string | null;
    current: string | null;
    changes: string[];
  }> {
    // Get the two most recent content versions
    // This is a simplified version - in a real implementation, you might want a more sophisticated diff
    const latestContent = await this.supabaseService.getLatestScrapedContent(infoUrlId);
    
    if (!latestContent) {
      return {
        previous: null,
        current: null,
        changes: [],
      };
    }

    // For now, we'll return basic information
    // In a more advanced implementation, you could use a library like 'diff' to generate detailed diffs
    return {
      previous: 'Previous content not available in this simplified implementation',
      current: latestContent.content,
      changes: ['Content comparison feature would be implemented here'],
    };
  }

  async getChangeStatistics(days: number = 30): Promise<{
    totalChanges: number;
    changesByType: Record<string, number>;
    mostActiveUrls: Array<{ infoUrlId: string; changeCount: number }>;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const allChanges = await this.supabaseService.getUnprocessedContentChanges();
    const recentChanges = allChanges.filter(change => 
      new Date(change.detectedAt) >= cutoffDate
    );

    const changesByType = recentChanges.reduce((acc, change) => {
      acc[change.changeType] = (acc[change.changeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const urlChangeCounts = recentChanges.reduce((acc, change) => {
      acc[change.infoUrlId] = (acc[change.infoUrlId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveUrls = Object.entries(urlChangeCounts)
      .map(([infoUrlId, changeCount]) => ({ infoUrlId, changeCount }))
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, 10); // Top 10 most active URLs

    return {
      totalChanges: recentChanges.length,
      changesByType,
      mostActiveUrls,
    };
  }
} 