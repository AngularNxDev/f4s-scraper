# Mastra Gym Scraper - MCP Integration (App 3)

This is the **Mastra.ai LLM Agents** component (App 3) of the 4-app gym scraper architecture, now fully integrated with **Model Context Protocol (MCP)** for seamless communication with the MCP Server (App 1) and NestJS scraper (App 2).

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend      │◄──►│   MCP Server        │◄──►│  NestJS Scraper     │
│   (Qwik)        │    │   (App 1)           │    │  (App 2)            │
│   App 4         │    │   Node.js           │    │  Playwright+Supabase│
└─────────────────┘    └─────────────────────┘    └─────────────────────┘
                                 ▲
                                 │ MCP Protocol
                                 ▼
                       ┌─────────────────────┐
                       │  Mastra.ai Agents   │
                       │  (App 3 - This)     │
                       │  LLM Intelligence   │
                       └─────────────────────┘
```

## 🧠 MCP-Based Intelligence

### **Discovery Agent**
- **Role**: Intelligent URL discovery via MCP Server communication
- **Function**: Analyzes gym websites to find location pages through the MCP Server
- **MCP Integration**: Uses `mcpServerTool` to communicate with App 1, which coordinates with App 2
- **Output**: Prioritized URLs with confidence scores and reasoning

### **Analysis Agent**  
- **Role**: Content analysis via MCP Server communication
- **Function**: Extracts gym location data and detects changes through the MCP Server
- **MCP Integration**: Processes scraped content from App 2 via App 1's API
- **Output**: Structured location data with confidence scores and change detection

## 🔧 MCP Tools

### **MCP Server Tool**
- **Purpose**: Primary communication interface with MCP Server (App 1)
- **Operations**:
  - `discover_urls`: Trigger URL discovery via NestJS scraper
  - `analyze_content`: Analyze scraped content for location data
  - `trigger_scrape`: Initiate scraping jobs for discovered URLs

### **MCP Database Tool**
- **Purpose**: Query stored data via MCP Server
- **Operations**:
  - `get_base_urls`: Retrieve base URLs to process
  - `get_scraping_results`: Get historical scraping data
  - `get_discovered_urls`: Check existing discovered URLs
  - `get_location_changes`: Monitor location changes over time

## 🌊 MCP Workflows

### **Discovery Workflow**
1. **Check Existing Data**: Query existing URLs via MCP Server
2. **Perform Discovery**: Use MCP Server to discover new URLs via NestJS scraper
3. **Analyze & Prioritize**: Apply AI reasoning to prioritize discovered URLs

### **Content Analysis Workflow**
1. **Retrieve Content**: Get scraped content via MCP Server
2. **Extract Locations**: Use AI to extract structured location data
3. **Detect Changes**: Compare with previous content to identify changes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key
- MCP Server (App 1) running on port 3000
- NestJS Scraper (App 2) configured with Supabase

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

```env
# MCP Server Configuration
MCP_SERVER_URL=http://localhost:3000

# OpenAI API Configuration  
OPENAI_API_KEY=your_openai_api_key_here
```

### Running the Server

```bash
# Start the Mastra development server
npm run dev

# Server will be available at:
# - API: http://localhost:4111/api
# - Playground: http://localhost:4111/
# - Swagger: http://localhost:4111/swagger-ui
```

## 🧪 Testing MCP Integration

```bash
# Test the MCP integration
node test-mcp-integration.js
```

This will verify:
- ✅ Mastra server is running
- ✅ MCP-based agents are accessible
- ✅ MCP-based workflows are available
- ✅ API endpoints are responding

## 📡 API Endpoints

### Agents
- `GET /api/agents` - List available agents
- `POST /api/agents/discovery/generate` - Use discovery agent
- `POST /api/agents/analysis/generate` - Use analysis agent

### Workflows
- `GET /api/workflows` - List available workflows
- `POST /api/workflows/discovery/execute` - Run discovery workflow
- `POST /api/workflows/contentAnalysis/execute` - Run analysis workflow

## 🔄 MCP Communication Flow

1. **Frontend (App 4)** → **MCP Server (App 1)** → **Mastra Agents (App 3)**
2. **Mastra Agents** → **MCP Server** → **NestJS Scraper (App 2)**
3. **NestJS Scraper** → **Supabase Database** → **MCP Server** → **Mastra Agents**
4. **Mastra Agents** → **MCP Server** → **Frontend**

## 🎯 Key Features

### **Intelligent URL Discovery**
- AI-powered analysis of website structures
- Priority classification (high/medium/low)
- Confidence scoring for discovered URLs
- Integration with existing URL databases

### **Advanced Content Analysis**
- Location data extraction (addresses, phones, hours)
- Change detection between content versions
- Status identification (opening soon, now open, etc.)
- Confidence scoring for extracted data

### **MCP Protocol Integration**
- Standardized communication with other apps
- Centralized coordination through MCP Server
- Scalable architecture for multi-app systems
- Error handling and retry mechanisms

## 🛠️ Development

### Project Structure
```
src/
├── mastra/
│   ├── agents/           # MCP-integrated AI agents
│   │   ├── discoveryAgent.ts
│   │   └── analysisAgent.ts
│   ├── tools/            # MCP communication tools
│   │   └── mcpServerTool.ts
│   ├── workflows/        # MCP-based workflows
│   │   ├── discoveryWorkflow.ts
│   │   └── analysisWorkflow.ts
│   └── index.ts          # Main Mastra configuration
```

### Adding New MCP Operations

1. **Extend MCP Server Tool**:
```typescript
// Add new operation to mcpServerTool
case 'new_operation':
  const response = await fetch(`${mcpServerUrl}/new-endpoint`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
```

2. **Update Agent Instructions**:
```typescript
// Update agent to use new MCP operation
instructions: `Use mcp_server_communication tool with operation 'new_operation'...`
```

## 🔗 Integration with Other Apps

### **MCP Server (App 1)**
- Expects REST API endpoints for gym scraper operations
- Handles coordination between frontend, Mastra, and scraper
- Manages authentication and request routing

### **NestJS Scraper (App 2)**
- Receives scraping requests via MCP Server
- Stores results in Supabase database
- Provides content analysis data back to Mastra

### **Frontend (App 4)**
- Triggers discovery and analysis via MCP Server
- Displays results from Mastra agent analysis
- Manages user interactions and monitoring

## 📊 Monitoring & Observability

- **Mastra Playground**: Interactive testing at `http://localhost:4111/`
- **API Documentation**: Swagger UI at `http://localhost:4111/swagger-ui`
- **Logs**: Comprehensive logging for MCP communication
- **Error Handling**: Graceful degradation when MCP Server is unavailable

## 🚧 Next Steps

1. **Set up MCP Server (App 1)** with proper REST endpoints
2. **Configure NestJS Scraper (App 2)** with Supabase integration
3. **Test full MCP communication flow** between all apps
4. **Integrate with Frontend (App 4)** for complete user experience
5. **Add monitoring and alerting** for production deployment

## 📝 License

This project is part of the F4S AI Scraper system and follows the same licensing terms. 