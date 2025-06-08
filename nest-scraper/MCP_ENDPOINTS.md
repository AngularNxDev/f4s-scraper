# MCP Server API Endpoints Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Currently no authentication required. In production, you should implement API keys or JWT tokens.

---

## 🏥 **Health & Status Endpoints**

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Scraping Status
```http
GET /status/scraping
```
**Response:**
```json
{
  "isActive": false
}
```

### Change Statistics
```http
GET /status/changes
```
**Response:**
```json
{
  "totalChanges": 15,
  "changesByType": {
    "new_content": 5,
    "modified_content": 10,
    "removed_content": 0
  },
  "mostActiveUrls": [
    {
      "infoUrlId": "uuid-here",
      "changeCount": 3
    }
  ]
}
```

---

## 🌐 **Base URLs Management**

### Get All Base URLs
```http
GET /base-urls
```

### Create Base URL
```http
POST /base-urls
Content-Type: application/json

{
  "url": "https://example.com",
  "domain": "example.com"
}
```

### Update Base URL
```http
PUT /base-urls/:baseUrlId
Content-Type: application/json

{
  "status": "active|inactive|failed",
  "lastChecked": "2024-01-01T12:00:00.000Z"
}
```

---

## 🔗 **Info URLs Management**

### Get All Info URLs
```http
GET /info-urls
```

### Get Info URLs by Base URL
```http
GET /base-urls/:baseUrlId/info-urls
```

### Create Info URL
```http
POST /info-urls
Content-Type: application/json

{
  "baseUrlId": "uuid-here",
  "url": "https://example.com/sitemap.xml",
  "pageType": "sitemap|locations|store-locator|other"
}
```

### Update Info URL
```http
PUT /info-urls/:infoUrlId
Content-Type: application/json

{
  "status": "active|inactive|failed",
  "lastScraped": "2024-01-01T12:00:00.000Z"
}
```

---

## 🔍 **Scraped Content Endpoints**

### Get Latest Scraped Content
```http
GET /scraped-content/:infoUrlId/latest
```

### Get Scraped Content History
```http
GET /scraped-content/:infoUrlId/history?limit=10
```

---

## 📊 **Content Changes & Analysis**

### Get Unprocessed Content Changes
```http
GET /content-changes
```

### Get Content Changes by URL
```http
GET /content-changes/:infoUrlId
```

### Mark Change as Processed
```http
POST /content-changes/:changeId/mark-processed
```

### Get Content Analysis
```http
GET /content-analysis/:infoUrlId
```
**Response:**
```json
{
  "significantChanges": true,
  "newLocationsDetected": true,
  "analysis": "Analysis of 3 recent changes:\n- modified_content: 2 occurrences\n- new_content: 1 occurrences\n- Potential new locations detected in content"
}
```

### Get Content Diff
```http
GET /content-diff/:infoUrlId
```

---

## ⚙️ **Scraping Jobs Management**

### Get Pending Jobs
```http
GET /scraping-jobs/pending
```

### Get Completed Jobs
```http
GET /scraping-jobs/completed
```

### Get Specific Job
```http
GET /scraping-jobs/:jobId
```

---

## 🚀 **Manual Triggers**

### Trigger URL Discovery
```http
POST /trigger/url-discovery
```

### Trigger Content Scraping
```http
POST /trigger/content-scraping
```

### Trigger Single URL Scraping
```http
POST /trigger/scrape-url/:infoUrlId
```

### Discover URLs for Base URL
```http
POST /discover-urls/:baseUrlId
```

---

## 🔔 **Webhooks & Notifications**

### Register Webhook
```http
POST /webhook/register
Content-Type: application/json

{
  "url": "http://mcp-server:3001/webhook/scraper-alerts",
  "events": ["content_change", "new_url_discovered", "scraping_failed"]
}
```

### Test Connectivity
```http
POST /test/connectivity
Content-Type: application/json

{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "mcp-server"
}
```

---

## 📋 **Typical MCP Server Workflow**

### 1. Initial Setup
```bash
# Add a base URL to monitor
POST /base-urls
{
  "url": "https://gym-chain.com",
  "domain": "gym-chain.com"
}

# Discover URLs for the base URL
POST /discover-urls/{baseUrlId}

# Check discovered URLs
GET /base-urls/{baseUrlId}/info-urls
```

### 2. Regular Operations
```bash
# Check for content changes
GET /content-changes

# Get change analysis
GET /content-analysis/{infoUrlId}

# Mark changes as processed
POST /content-changes/{changeId}/mark-processed
```

### 3. Manual Controls
```bash
# Trigger immediate scraping
POST /trigger/content-scraping

# Check scraping status
GET /status/scraping

# Get latest scraped content
GET /scraped-content/{infoUrlId}/latest
```

### 4. Health Monitoring
```bash
# Health check
GET /health

# Get statistics
GET /status/changes

# Test connectivity
POST /test/connectivity
```

---

## 🔧 **Integration Notes for MCP Server**

### Error Handling
All endpoints return standard HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

### Rate Limiting
Consider implementing rate limiting on the MCP server side to avoid overwhelming the scraper.

### Webhooks (Future)
The scraper will call MCP server webhooks when:
- Content changes are detected
- New URLs are discovered
- Scraping jobs fail
- Significant analysis results are found

### Data Flow
1. **MCP Server** → **Scraper**: Trigger operations, get data
2. **Scraper** → **MCP Server**: Send alerts, status updates
3. **Scraper** → **Supabase**: Store all data
4. **MCP Server** → **Frontend**: Provide API for dashboard
5. **MCP Server** → **Mastra.ai**: Send data for LLM analysis 