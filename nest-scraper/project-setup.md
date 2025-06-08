Overall Architecture
lua
Kopiëren
Bewerken
+------------+        +----------------------+        +-----------------------+
| Frontend   |  <---> | MCP Server (App 1)   |  <---> | NestJS Scraper (App 2)|
| (Qwik)     |        | (Node.js)            |        | (Playwright, Supabase)|
+------------+        +----------------------+        +-----------------------+
                             ^
                             |
                             v
                      +---------------------+
                      | Mastra.ai LLM Agents|
                      | (App 3)             |
                      +---------------------+
Detailed Plan per Application
🔹 App 1: MCP Server (Node.js)
Purpose:
Expose API endpoints to standardize interaction between frontend, scraper app, and Mastra agents.

Core Responsibilities:

Central communication hub.

RESTful API to:

Retrieve base URLs from Supabase (through App 2).

Update URL discovery info in Supabase.

Retrieve scraping results.

Handle LLM agent requests/responses (Mastra.ai).

Technology Stack:

Nestjs

TypeScript

Endpoints Example:

GET /base-urls → Fetch URLs for discovery.

POST /update-url → Update discovered information URLs.

POST /trigger-scrape → Trigger scraping of info URLs.

POST /alert-change → Receive alert signals from App 2.

🔹 App 2: NestJS Scraper Application
Purpose:
Manage scraping logic and database interactions.

Core Responsibilities:

Store/retrieve URLs and scraped content in Supabase.

Handle URL discovery logic.

Perform scraping with Playwright.

Detect changes by comparing current and previous content.

Send alert signals to MCP server when changes detected.

Technology Stack:

NestJS framework (Node.js + TypeScript)

Playwright for scraping

Supabase-js for database connection

Cron jobs (NestJS scheduler) for regular scraping tasks

Module Structure:

ScraperModule (Playwright integration)

SupabaseModule (DB interactions)

UrlDiscoveryModule (Find correct pages/sitemaps)

ContentComparisonModule (Detect content changes)

Example Workflow:

Fetch URLs to scan from Supabase.

Scrape sitemap or page using Playwright.

Store/update discovered URLs into Supabase.

Run scraping tasks regularly to detect changes.

Notify MCP server on any detected changes.

🔹 App 3: Mastra.ai (LLM Agents)
Purpose:
Empower smart scraping through intelligent, LLM-based agents.

Core Responsibilities:

Intelligent URL discovery agent:

Uses LLM to intelligently identify potential URLs containing location information.

Content analysis agent:

Analyze scraped content to confirm if the page content reflects a new gym opening or relevant changes.

Technology/Integration:

Mastra.ai platform or custom LLM integration (GPT-4, Claude).

API calls via MCP Server.

Uses standardized MCP communication protocol for interactions.

Agent Types:

Discovery Agent

Input: base URL, website content.

Output: identified correct sitemap or locations page.

Analysis Agent

Input: scraped page content.

Output: structured information indicating detected new locations or changes.

🔹 App 4: Frontend Control Application
Purpose:
Provides user-friendly monitoring, control, and interaction with the scraper system.

Technology Stack:

Qwik (for reactive, fast performance)

TailwindCSS (UI/styling)

Axios for API calls

Dashboard with clearly visualized status indicators

Key Features:

Dashboard overview of scraping status.

Alerts when new locations are discovered or content changes.

Manual triggers for scraping or re-checking.

Historical view and logs of scraping results.

Suggested Components:

Dashboard (status, alerts)

URL Manager (view/edit base and info URLs)

Logs/History (scraping run logs, comparisons)

Notifications (Slack, Email integration)

🚧 Implementation Roadmap (Iterative)
Phase 1: Basic MCP & Scraper Integration (MVP)
Setup basic MCP server (App 1).

Simple NestJS scraper to fetch known URLs and store content (App 2).

Manual frontend interface (App 4).

Phase 2: Intelligent Discovery (Mastra Integration)
Integrate Mastra.ai LLM for discovery and analysis agents (App 3).

Implement MCP endpoints for Mastra communications (App 1).

Expand NestJS scraping logic and URL handling (App 2).

Phase 3: Robustness & Frontend Enhancement
Develop detailed frontend dashboards, logging, and controls (App 4).

Extensive error handling, retries, and automated alerts across backend (Apps 1 & 2).

📌 Key Considerations
Reliability: Use robust error handling, retries, and logging.

Privacy and Compliance: Respect robots.txt, GDPR, and data protection regulations.

Efficiency: Cache data where possible, reduce scraping frequency for unchanged sites.

Observability: Implement comprehensive logging and monitoring (e.g., Prometheus, Grafana).

🔖 Example Data Flow
pgsql
Kopiëren
Bewerken
Frontend (App 4) triggers URL discovery via MCP server (App 1)
    |
    v
MCP server requests URL discovery from NestJS scraper (App 2)
    |
    v
NestJS scraper gets base URLs from Supabase, sends them to Mastra LLM agents (App 3 via App 1)
    |
    v
Mastra.ai discovery agent identifies relevant pages
    |
    v
Mastra returns discovered URLs → NestJS scraper updates Supabase
    |
    v
Regular scraping checks content → NestJS compares results
    |
    v
If content changes → NestJS scraper alerts MCP server
    |
    v
Frontend (App 4) receives alert → User notified, visible dashboard update
