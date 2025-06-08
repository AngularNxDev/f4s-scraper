# Install Dependencies for All F4S AI Scraper Applications
Write-Host "📦 Installing dependencies for all F4S AI Scraper applications..." -ForegroundColor Green

# Install dependencies for each application
Write-Host "🔧 Installing NestJS Scraper dependencies..." -ForegroundColor Blue
Set-Location "nest-scraper"
npm install
Set-Location ".."

Write-Host "🎨 Installing Qwik Scraper dependencies..." -ForegroundColor Blue  
Set-Location "qwik-scraper"
npm install
Set-Location ".."

Write-Host "🤖 Installing Mastra Scraper dependencies..." -ForegroundColor Blue
Set-Location "mastra-scraper"
npm install
Set-Location ".."

Write-Host "🌐 Installing MCP Server dependencies..." -ForegroundColor Blue
Set-Location "mcp-server"
npm install
Set-Location ".."

Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host "💡 You can now run '.\start-all-services.ps1' to start all services" -ForegroundColor Yellow 