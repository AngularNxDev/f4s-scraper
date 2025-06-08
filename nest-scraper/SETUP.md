# NestJS Scraper Setup Guide

## Overview
This NestJS application is part of the F4S AI Scraper system (App 2 in the architecture). It handles web scraping with Playwright, URL discovery, content comparison, and integrates with Supabase for data storage.

## Architecture Components
- **ScraperModule**: Handles Playwright web scraping
- **SupabaseModule**: Database operations with Supabase
- **UrlDiscoveryModule**: Finds relevant URLs (sitemaps, location pages)
- **ContentComparisonModule**: Detects content changes
- **SchedulerModule**: Manages automated scraping tasks

## Prerequisites
1. Node.js 18+ installed
2. A Supabase project set up
3. Git (for cloning)

## Installation Steps

### 1. Environment Configuration
Copy the environment template and fill in your Supabase credentials:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase configuration:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key
```

### 2. Database Setup
You'll need to create the following tables in your Supabase database:

```sql
-- Base URLs table
CREATE TABLE base_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'failed')) DEFAULT 'active',
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Info URLs table  
CREATE TABLE info_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  base_url_id UUID REFERENCES base_urls(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  page_type TEXT CHECK (page_type IN ('sitemap', 'locations', 'store-locator', 'other')) DEFAULT 'other',
  status TEXT CHECK (status IN ('active', 'inactive', 'failed')) DEFAULT 'active',
  last_scraped TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraped content table
CREATE TABLE scraped_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  info_url_id UUID REFERENCES info_urls(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  metadata JSONB,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content changes table
CREATE TABLE content_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  info_url_id UUID REFERENCES info_urls(id) ON DELETE CASCADE,
  previous_content_hash TEXT NOT NULL,
  new_content_hash TEXT NOT NULL,
  change_type TEXT CHECK (change_type IN ('new_content', 'modified_content', 'removed_content')) NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Scraping jobs table
CREATE TABLE scraping_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  info_url_id UUID REFERENCES info_urls(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_base_urls_status ON base_urls(status);
CREATE INDEX idx_info_urls_base_url_id ON info_urls(base_url_id);
CREATE INDEX idx_info_urls_status ON info_urls(status);
CREATE INDEX idx_scraped_content_info_url_id ON scraped_content(info_url_id);
CREATE INDEX idx_content_changes_info_url_id ON content_changes(info_url_id);
CREATE INDEX idx_content_changes_processed ON content_changes(processed);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Install Playwright Browsers
```bash
npx playwright install chromium
```

### 5. Start the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## API Endpoints

### Health Check
- `GET /health` - Application health status

### Base URLs Management
- `GET /base-urls` - Get all active base URLs
- `POST /base-urls` - Create a new base URL
  ```json
  {
    "url": "https://example.com",
    "domain": "example.com"
  }
  ```

### Info URLs
- `GET /info-urls` - Get all active info URLs
- `GET /base-urls/:baseUrlId/info-urls` - Get info URLs for a specific base URL

### Manual Triggers
- `POST /trigger/url-discovery` - Manually trigger URL discovery
- `POST /trigger/content-scraping` - Manually trigger content scraping
- `POST /trigger/scrape-url/:infoUrlId` - Scrape a specific URL
- `POST /discover-urls/:baseUrlId` - Discover URLs for a specific base URL

### Status & Monitoring
- `GET /status/scraping` - Current scraping status
- `GET /status/changes` - Content change statistics
- `GET /content-changes` - Unprocessed content changes
- `GET /scraping-jobs/pending` - Pending scraping jobs

## Automated Scheduling

The application runs automated tasks:
- **URL Discovery**: Every 6 hours
- **Content Scraping**: Every 2 hours  
- **Health Checks**: Every 30 minutes
- **Data Cleanup**: Daily at 2 AM

## Testing the Setup

1. **Add a base URL**:
```bash
curl -X POST http://localhost:3000/base-urls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "domain": "example.com"}'
```

2. **Trigger URL discovery**:
```bash
curl -X POST http://localhost:3000/trigger/url-discovery
```

3. **Check discovered URLs**:
```bash
curl http://localhost:3000/info-urls
```

4. **Trigger content scraping**:
```bash
curl -X POST http://localhost:3000/trigger/content-scraping
```

## Configuration

### Environment Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `MCP_SERVER_URL`: URL of the MCP server (optional)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Application port (default: 3000)

### Scraping Configuration
The scraper is configured with:
- Chromium browser in headless mode
- 30-second timeout for page loads
- Retry logic with exponential backoff
- Respectful 2-second delays between requests

## Troubleshooting

### Common Issues

1. **Supabase connection errors**:
   - Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
   - Ensure your Supabase project is active

2. **Playwright browser issues**:
   - Run `npx playwright install chromium` to install browsers
   - On Linux, you may need additional dependencies

3. **Permission errors**:
   - Ensure the application has write permissions for logs
   - Check that the port is not already in use

### Logs
The application uses NestJS built-in logging. Check the console output for detailed logs about scraping activities, errors, and status updates.

## Next Steps

1. Set up the MCP Server (App 1) to communicate with this scraper
2. Configure the Mastra.ai LLM agents (App 3) for intelligent discovery
3. Build the frontend dashboard (App 4) for monitoring and control
4. Set up proper monitoring and alerting for production use 