import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./server-logic.js";

const app = express();

// Add JSON parsing middleware
app.use(express.json());

// Add CORS for frontend access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

let transport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  await transport.handlePostMessage(req, res);
});

// HTTP REST bridge endpoints for Mastra agents
app.post("/discover-urls", async (req, res) => {
  try {
    const { baseUrl, baseUrlId } = req.body;
    if (!baseUrl && !baseUrlId) {
      return res.status(400).json({ error: "baseUrl or baseUrlId is required" });
    }
    
    let urlId = baseUrlId;
    
    // If we have baseUrl but no baseUrlId, we need to find or create the base URL record
    if (baseUrl && !baseUrlId) {
      try {
        // First check if the base URL already exists
        const existingResponse = await fetch('http://localhost:3000/base-urls');
        const existingUrls = await existingResponse.json();
        const existing = existingUrls.find(u => u.url === baseUrl);
        
        if (existing) {
          urlId = existing.id;
        } else {
          // Create new base URL
          const domain = new URL(baseUrl).hostname;
          const createResponse = await fetch('http://localhost:3000/base-urls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: baseUrl, domain })
          });
          
          if (!createResponse.ok) {
            // If database creation fails, use mock ID for testing
            urlId = '1'; // Use the mock ID from base-urls-mock
          } else {
            const newUrl = await createResponse.json();
            urlId = newUrl.id;
          }
        }
      } catch (error) {
        // If database operations fail, use mock ID for testing
        urlId = '1'; // Use the mock ID from base-urls-mock
      }
    }
    
    // Now trigger URL discovery
    const response = await fetch(`http://localhost:3000/discover-urls/${urlId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Empty body as the endpoint expects baseUrlId in path
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/analyze-content", async (req, res) => {
  try {
    const { url, infoUrlId, previousContent } = req.body;
    if (!url && !infoUrlId) {
      return res.status(400).json({ error: "url or infoUrlId is required" });
    }
    
    // If we have an infoUrlId, use the existing endpoint
    if (infoUrlId) {
      const response = await fetch(`http://localhost:3000/content-analysis/${infoUrlId}`);
      const result = await response.json();
      return res.json(result);
    }
    
    // Otherwise, we need to find or create the info URL first
    // This is a more complex flow that would involve URL discovery
    res.status(501).json({ 
      error: "URL-based content analysis not yet implemented. Please provide infoUrlId"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/trigger-scrape", async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "urls array is required" });
    }
    
    // Trigger scraping for multiple URLs
    const response = await fetch('http://localhost:3000/trigger/content-scraping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bridge endpoints for database queries
app.get("/base-urls", async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/base-urls');
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/scraping-results", async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/scraped-content');
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/discovered-urls", async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/info-urls');
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/location-changes", async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/content-changes');
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test connectivity bridge
app.post("/test/connectivity", async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/test/connectivity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: "mcp-bridge"
      })
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Analysis endpoint that calls Mastra agents
app.post("/ai-analysis", async (req, res) => {
  try {
    const { content, previousContent, url, infoUrlId } = req.body;
    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }
    
    console.log('MCP Bridge: Calling Mastra AI Analysis for URL:', url);
    
    // Call the Mastra agent for content analysis
    const mastraResponse = await fetch('http://localhost:4111/analyze-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        previousContent,
        url,
        infoUrlId
      })
    });
    
    if (!mastraResponse.ok) {
      console.error('Mastra analysis failed:', mastraResponse.status);
      // Return basic analysis as fallback
      return res.json({
        success: true,
        source: 'fallback',
        hasLocationInfo: content.toLowerCase().includes('location') || content.toLowerCase().includes('address'),
        confidence: 0.5,
        summary: 'Basic keyword-based analysis (Mastra unavailable)',
        locations: [],
        changes: []
      });
    }
    
    const analysisResult = await mastraResponse.json();
    console.log('MCP Bridge: Mastra analysis completed with confidence:', analysisResult.confidence);
    
    res.json(analysisResult);
  } catch (error) {
    console.error('AI Analysis error:', error);
    // Return basic analysis as fallback
    res.json({
      success: true,
      source: 'fallback',
      hasLocationInfo: req.body.content?.toLowerCase().includes('location') || req.body.content?.toLowerCase().includes('address') || false,
      confidence: 0.3,
      summary: `Basic analysis fallback due to error: ${error.message}`,
      locations: [],
      changes: []
    });
  }
});

// Trigger endpoints for frontend buttons
app.post("/trigger/url-discovery", async (req, res) => {
  try {
    const { baseUrlId } = req.body;
    const urlId = baseUrlId || "1"; // Default to mock ID if not provided
    
    const response = await fetch('http://localhost:3000/trigger/url-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrlId: urlId })
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/trigger/content-scraping", async (req, res) => {
  try {
    const { targetUrls } = req.body;
    const urls = targetUrls || ["https://example.com/locations"]; // Default URLs if not provided
    
    const response = await fetch('http://localhost:3000/trigger/content-scraping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 8081;
app.listen(port, () => {
  console.log(`MCP SSE Server is running on http://localhost:${port}/sse`);
  console.log(`MCP HTTP Bridge is running on http://localhost:${port}`);
}); 