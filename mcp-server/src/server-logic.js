import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const server = new McpServer({
  name: "Scraper MCP Server",
  version: "1.0.0",
});

// Base URL for API calls - should be configurable via environment
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

// Helper function to make API calls
async function makeApiCall(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`API call error: ${error.message}`);
  }
}

// 🏥 Health & Status Endpoints

server.tool("getHealth", "Get health status of the scraper service", {}, async () => {
  const data = await makeApiCall("/health");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("getScrapingStatus", "Get current scraping status", {}, async () => {
  const data = await makeApiCall("/status/scraping");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("getChangeStatistics", "Get content change statistics", {}, async () => {
  const data = await makeApiCall("/status/changes");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

// 🌐 Base URLs Management

server.tool("getAllBaseUrls", "Get all base URLs being monitored", {}, async () => {
  const data = await makeApiCall("/base-urls");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("createBaseUrl", "Create a new base URL to monitor", {
  url: z.string().url().describe("The URL to monitor"),
  domain: z.string().describe("The domain name")
}, async ({ url, domain }) => {
  const data = await makeApiCall("/base-urls", "POST", { url, domain });
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("updateBaseUrl", "Update a base URL status", {
  baseUrlId: z.string().describe("Base URL ID"),
  status: z.enum(["active", "inactive", "failed"]).describe("New status"),
  lastChecked: z.string().optional().describe("Last checked timestamp")
}, async ({ baseUrlId, status, lastChecked }) => {
  const body = { status };
  if (lastChecked) body.lastChecked = lastChecked;
  
  const data = await makeApiCall(`/base-urls/${baseUrlId}`, "PUT", body);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

// 🔗 Info URLs Management

server.tool("getAllInfoUrls", "Get all info URLs", {}, async () => {
  const data = await makeApiCall("/info-urls");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("getInfoUrlsByBaseUrl", "Get info URLs for a specific base URL", {
  baseUrlId: z.string().describe("Base URL ID")
}, async ({ baseUrlId }) => {
  const data = await makeApiCall(`/base-urls/${baseUrlId}/info-urls`);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("createInfoUrl", "Create a new info URL", {
  baseUrlId: z.string().describe("Base URL ID"),
  url: z.string().url().describe("Info URL"),
  pageType: z.enum(["sitemap", "locations", "store-locator", "other"]).describe("Type of page")
}, async ({ baseUrlId, url, pageType }) => {
  const data = await makeApiCall("/info-urls", "POST", { baseUrlId, url, pageType });
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("updateInfoUrl", "Update an info URL", {
  infoUrlId: z.string().describe("Info URL ID"),
  status: z.enum(["active", "inactive", "failed"]).describe("New status"),
  lastScraped: z.string().optional().describe("Last scraped timestamp")
}, async ({ infoUrlId, status, lastScraped }) => {
  const body = { status };
  if (lastScraped) body.lastScraped = lastScraped;
  
  const data = await makeApiCall(`/info-urls/${infoUrlId}`, "PUT", body);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

// 🔍 Scraped Content Endpoints

server.tool("getLatestScrapedContent", "Get latest scraped content for a URL", {
  infoUrlId: z.string().describe("Info URL ID")
}, async ({ infoUrlId }) => {
  const data = await makeApiCall(`/scraped-content/${infoUrlId}/latest`);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("getScrapedContentHistory", "Get scraped content history for a URL", {
  infoUrlId: z.string().describe("Info URL ID"),
  limit: z.number().optional().default(10).describe("Number of records to return")
}, async ({ infoUrlId, limit }) => {
  const data = await makeApiCall(`/scraped-content/${infoUrlId}/history?limit=${limit}`);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

// 📊 Content Changes & Analysis

server.tool("getUnprocessedContentChanges", "Get all unprocessed content changes", {}, async () => {
  const data = await makeApiCall("/content-changes");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("getContentChangesByUrl", "Get content changes for a specific URL", {
  infoUrlId: z.string().describe("Info URL ID")
}, async ({ infoUrlId }) => {
  const data = await makeApiCall(`/content-changes/${infoUrlId}`);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("markChangeAsProcessed", "Mark a content change as processed", {
  changeId: z.string().describe("Change ID")
}, async ({ changeId }) => {
  const data = await makeApiCall(`/content-changes/${changeId}/mark-processed`, "POST");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("getContentAnalysis", "Get content analysis for a URL", {
  infoUrlId: z.string().describe("Info URL ID")
}, async ({ infoUrlId }) => {
  const data = await makeApiCall(`/content-analysis/${infoUrlId}`);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("getContentDiff", "Get content diff for a URL", {
  infoUrlId: z.string().describe("Info URL ID")
}, async ({ infoUrlId }) => {
  const data = await makeApiCall(`/content-diff/${infoUrlId}`);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

// ⚙️ Scraping Jobs Management

server.tool("getPendingJobs", "Get pending scraping jobs", {}, async () => {
  const data = await makeApiCall("/scraping-jobs/pending");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("getCompletedJobs", "Get completed scraping jobs", {}, async () => {
  const data = await makeApiCall("/scraping-jobs/completed");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("getSpecificJob", "Get details for a specific scraping job", {
  jobId: z.string().describe("Job ID")
}, async ({ jobId }) => {
  const data = await makeApiCall(`/scraping-jobs/${jobId}`);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

// 🚀 Manual Triggers

server.tool("triggerUrlDiscovery", "Trigger URL discovery process", {}, async () => {
  const data = await makeApiCall("/trigger/url-discovery", "POST");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("triggerContentScraping", "Trigger content scraping process", {}, async () => {
  const data = await makeApiCall("/trigger/content-scraping", "POST");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("triggerSingleUrlScraping", "Trigger scraping for a single URL", {
  infoUrlId: z.string().describe("Info URL ID")
}, async ({ infoUrlId }) => {
  const data = await makeApiCall(`/trigger/scrape-url/${infoUrlId}`, "POST");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("discoverUrlsForBaseUrl", "Discover URLs for a specific base URL", {
  baseUrlId: z.string().describe("Base URL ID")
}, async ({ baseUrlId }) => {
  const data = await makeApiCall(`/discover-urls/${baseUrlId}`, "POST");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

// 🔔 Webhooks & Notifications

server.tool("registerWebhook", "Register a webhook for notifications", {
  url: z.string().url().describe("Webhook URL"),
  events: z.array(z.enum(["content_change", "new_url_discovered", "scraping_failed"])).describe("Events to subscribe to")
}, async ({ url, events }) => {
  const data = await makeApiCall("/webhook/register", "POST", { url, events });
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("testConnectivity", "Test connectivity to the scraper service", {}, async () => {
  const data = await makeApiCall("/test/connectivity", "POST", {
    timestamp: new Date().toISOString(),
    source: "mcp-server"
  });
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

// Example tool from original code (commented out)
// server.tool("getChartData", "Get data for a specific widget or chart", {
//   id: z.string().describe("Widget or chart id"),
// }, async ({id}) => {
//   console.error("Fetching widget");
//   const res = await fetch(`
// https://demo.focusfeedback.nl/FF_BSH_TEST/servoy-service/velocity/feedback_api/2/report_data/${id}`, {
//     headers: {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json'
//     }
//   });
//   const response = await res.json();

//   return { content: [{ type: "text", text: JSON.stringify(response) }] };
// });
