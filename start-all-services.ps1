# F4S AI Scraper - Service Startup Script
# This script starts all required services in the correct order

Write-Host "🚀 Starting F4S AI Scraper Services..." -ForegroundColor Green

# Kill any existing Node.js processes to avoid port conflicts
Write-Host "Stopping any existing Node.js processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $Port)
        $tcpClient.Close()
        return $true  # Port is in use
    }
    catch {
        return $false  # Port is available
    }
}

# Check and wait for ports to be free
$ports = @(3000, 4111, 5174, 8081)
foreach ($port in $ports) {
    if (Test-Port $port) {
        Write-Host "⚠️  Port $port is still in use, waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

Write-Host "📦 Starting services..." -ForegroundColor Cyan

# Start NestJS Scraper (Port 3000)
Write-Host "🔧 Starting NestJS Scraper..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\nest-scraper'; npm run start:dev" -WindowStyle Normal

Start-Sleep -Seconds 5

# Start MCP Server (Port 8081)
Write-Host "🌐 Starting MCP Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\mcp-server'; node src/sse-server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Mastra AI Agents (Port 4111)
Write-Host "🤖 Starting Mastra AI Agents..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\mastra-scraper'; npx mastra dev" -WindowStyle Normal

Start-Sleep -Seconds 5

# Start Qwik Frontend (Port 5174)
Write-Host "🎨 Starting Qwik Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\qwik-scraper'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ All services starting..." -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Access URLs:" -ForegroundColor Cyan
Write-Host "   Dashboard:    http://localhost:5174/dashboard" -ForegroundColor White
Write-Host "   Monitoring:   http://localhost:5174/monitoring" -ForegroundColor White
Write-Host "   Jobs:         http://localhost:5174/jobs" -ForegroundColor White
Write-Host "   URLs:         http://localhost:5174/urls" -ForegroundColor White
Write-Host "   NestJS API:   http://localhost:3000" -ForegroundColor White
Write-Host "   MCP Bridge:   http://localhost:8081" -ForegroundColor White
Write-Host "   Mastra AI:    http://localhost:4111" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Services may take 30-60 seconds to fully start" -ForegroundColor Yellow
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")