import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ContentComparisonService } from './content-comparison.service';

@Module({
  imports: [SupabaseModule],
  providers: [ContentComparisonService],
  exports: [ContentComparisonService],
})
export class ContentComparisonModule {} 