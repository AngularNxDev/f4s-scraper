-- F4S AI Scraper Database Setup
-- This script creates all the required tables for the scraper system

-- Base URLs table
CREATE TABLE IF NOT EXISTS base_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'failed')) DEFAULT 'active',
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Info URLs table
CREATE TABLE IF NOT EXISTS info_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  base_url_id UUID NOT NULL REFERENCES base_urls(id) ON DELETE CASCADE,
  url TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL CHECK (page_type IN ('sitemap', 'locations', 'store-locator', 'other')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'failed')) DEFAULT 'active',
  last_scraped TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraped Content table
CREATE TABLE IF NOT EXISTS scraped_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  info_url_id UUID NOT NULL REFERENCES info_urls(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  metadata JSONB,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Changes table
CREATE TABLE IF NOT EXISTS content_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  info_url_id UUID NOT NULL REFERENCES info_urls(id) ON DELETE CASCADE,
  previous_content_hash TEXT NOT NULL,
  new_content_hash TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('new_content', 'modified_content', 'removed_content')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Scraping Jobs table
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  info_url_id UUID NOT NULL REFERENCES info_urls(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_base_urls_status ON base_urls(status);
CREATE INDEX IF NOT EXISTS idx_base_urls_domain ON base_urls(domain);

CREATE INDEX IF NOT EXISTS idx_info_urls_base_url_id ON info_urls(base_url_id);
CREATE INDEX IF NOT EXISTS idx_info_urls_status ON info_urls(status);
CREATE INDEX IF NOT EXISTS idx_info_urls_page_type ON info_urls(page_type);

CREATE INDEX IF NOT EXISTS idx_scraped_content_info_url_id ON scraped_content(info_url_id);
CREATE INDEX IF NOT EXISTS idx_scraped_content_scraped_at ON scraped_content(scraped_at);
CREATE INDEX IF NOT EXISTS idx_scraped_content_hash ON scraped_content(content_hash);

CREATE INDEX IF NOT EXISTS idx_content_changes_info_url_id ON content_changes(info_url_id);
CREATE INDEX IF NOT EXISTS idx_content_changes_processed ON content_changes(processed);
CREATE INDEX IF NOT EXISTS idx_content_changes_detected_at ON content_changes(detected_at);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_info_url_id ON scraping_jobs(info_url_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at);

-- Enable Row Level Security (RLS) - you can customize these policies as needed
ALTER TABLE base_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - customize based on your auth needs)
CREATE POLICY "Allow all operations on base_urls" ON base_urls FOR ALL USING (true);
CREATE POLICY "Allow all operations on info_urls" ON info_urls FOR ALL USING (true);
CREATE POLICY "Allow all operations on scraped_content" ON scraped_content FOR ALL USING (true);
CREATE POLICY "Allow all operations on content_changes" ON content_changes FOR ALL USING (true);
CREATE POLICY "Allow all operations on scraping_jobs" ON scraping_jobs FOR ALL USING (true);

-- Insert some sample data for testing
INSERT INTO base_urls (url, domain, status) VALUES 
  ('https://example.com', 'example.com', 'active'),
  ('https://test.com', 'test.com', 'active')
ON CONFLICT (url) DO NOTHING;

-- Display confirmation message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Tables created: base_urls, info_urls, scraped_content, content_changes, scraping_jobs';
  RAISE NOTICE 'Indexes and policies configured.';
  RAISE NOTICE 'Sample data inserted.';
END $$; 