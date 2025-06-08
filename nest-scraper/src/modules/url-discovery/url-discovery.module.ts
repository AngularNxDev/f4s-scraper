import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ScraperModule } from '../scraper/scraper.module';
import { UrlDiscoveryService } from './url-discovery.service';

@Module({
  imports: [SupabaseModule, ScraperModule],
  providers: [UrlDiscoveryService],
  exports: [UrlDiscoveryService],
})
export class UrlDiscoveryModule {} 