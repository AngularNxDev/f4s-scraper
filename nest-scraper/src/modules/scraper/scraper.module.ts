import { Module, forwardRef } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ScraperService } from './scraper.service';

@Module({
  imports: [SupabaseModule],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {} 