import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ScraperModule } from '../scraper/scraper.module';
import { UrlDiscoveryModule } from '../url-discovery/url-discovery.module';
import { ContentComparisonModule } from '../content-comparison/content-comparison.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    SupabaseModule,
    ScraperModule,
    UrlDiscoveryModule,
    ContentComparisonModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {} 