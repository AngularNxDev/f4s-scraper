import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('system-status')
  async getSystemStatus() {
    return this.dashboardService.getSystemStatus();
  }

  @Get('scraping-stats')
  async getScrapingStats(@Query('days') days?: string) {
    const dayCount = days ? parseInt(days, 10) : 7;
    return this.dashboardService.getScrapingStats(dayCount);
  }

  @Get('recent-activities')
  async getRecentActivities(@Query('limit') limit?: string) {
    const limitCount = limit ? parseInt(limit, 10) : 20;
    return this.dashboardService.getRecentActivities(limitCount);
  }

  @Get('content-changes')
  async getContentChanges(@Query('days') days?: string) {
    const dayCount = days ? parseInt(days, 10) : 7;
    return this.dashboardService.getContentChanges(dayCount);
  }

  @Get('ai-analysis-results')
  async getAIAnalysisResults(@Query('limit') limit?: string) {
    const limitCount = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getAIAnalysisResults(limitCount);
  }

  @Get('database-metrics')
  async getDatabaseMetrics() {
    return this.dashboardService.getDatabaseMetrics();
  }

  @Get('service-health')
  async getServiceHealth() {
    return this.dashboardService.getServiceHealth();
  }
} 