import { Injectable } from '@nestjs/common';

export interface SystemStatus {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  cpu: number;
  services: {
    database: 'connected' | 'disconnected';
    mcp: 'connected' | 'disconnected';
    mastra: 'connected' | 'disconnected';
  };
}

export interface ScrapingStats {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averageResponseTime: number;
  jobsToday: number;
  successRate: number;
}

export interface RecentActivity {
  id: string;
  type: 'scrape' | 'analysis' | 'discovery' | 'error';
  message: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

export interface ContentChange {
  id: string;
  url: string;
  changeType: 'added' | 'modified' | 'removed';
  timestamp: Date;
  summary: string;
}

export interface AIAnalysisResult {
  id: string;
  url: string;
  analysisType: string;
  result: unknown;
  confidence: number;
  timestamp: Date;
}

export interface DatabaseMetrics {
  totalRecords: number;
  storageUsed: string;
  connectionCount: number;
  queryPerformance: {
    averageTime: number;
    slowQueries: number;
  };
}

export interface ServiceHealth {
  nestjs: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  };
  database: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  };
  mcp: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  };
  mastra: {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  };
}

@Injectable()
export class DashboardService {
  async getSystemStatus(): Promise<SystemStatus> {
    // Mock implementation - replace with actual system monitoring
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().rss / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      cpu: Math.random() * 100, // Mock CPU usage
      services: {
        database: 'connected',
        mcp: 'connected',
        mastra: 'connected',
      },
    };
  }

  async getScrapingStats(days: number): Promise<ScrapingStats> {
    // Mock implementation - replace with actual database queries
    return {
      totalJobs: Math.floor(Math.random() * 1000) + 500,
      successfulJobs: Math.floor(Math.random() * 900) + 450,
      failedJobs: Math.floor(Math.random() * 50) + 10,
      averageResponseTime: Math.floor(Math.random() * 2000) + 500,
      jobsToday: Math.floor(Math.random() * 50) + 10,
      successRate: Math.round((Math.random() * 20 + 80) * 100) / 100,
    };
  }

  async getRecentActivities(limit: number): Promise<RecentActivity[]> {
    // Mock implementation - replace with actual database queries
    const activities: RecentActivity[] = [];
    const types: Array<'scrape' | 'analysis' | 'discovery' | 'error'> = ['scrape', 'analysis', 'discovery', 'error'];
    const statuses: Array<'success' | 'warning' | 'error'> = ['success', 'warning', 'error'];
    
    for (let i = 0; i < limit; i++) {
      activities.push({
        id: `activity-${i + 1}`,
        type: types[Math.floor(Math.random() * types.length)],
        message: `Mock activity ${i + 1} - ${types[Math.floor(Math.random() * types.length)]} operation`,
        timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getContentChanges(days: number): Promise<ContentChange[]> {
    // Mock implementation - replace with actual database queries
    const changes: ContentChange[] = [];
    const changeTypes: Array<'added' | 'modified' | 'removed'> = ['added', 'modified', 'removed'];
    
    for (let i = 0; i < 10; i++) {
      changes.push({
        id: `change-${i + 1}`,
        url: `https://example${i + 1}.com/page`,
        changeType: changeTypes[Math.floor(Math.random() * changeTypes.length)],
        timestamp: new Date(Date.now() - Math.random() * days * 86400000),
        summary: `Content ${changeTypes[Math.floor(Math.random() * changeTypes.length)]} on page ${i + 1}`,
      });
    }
    
    return changes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAIAnalysisResults(limit: number): Promise<AIAnalysisResult[]> {
    // Mock implementation - replace with actual database queries
    const results: AIAnalysisResult[] = [];
    const analysisTypes = ['sentiment', 'classification', 'extraction', 'summary'];
    
    for (let i = 0; i < limit; i++) {
      results.push({
        id: `analysis-${i + 1}`,
        url: `https://example${i + 1}.com/page`,
        analysisType: analysisTypes[Math.floor(Math.random() * analysisTypes.length)],
        result: { summary: `Mock analysis result ${i + 1}` },
        confidence: Math.round((Math.random() * 30 + 70) * 100) / 100,
        timestamp: new Date(Date.now() - Math.random() * 86400000),
      });
    }
    
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    // Mock implementation - replace with actual database queries
    return {
      totalRecords: Math.floor(Math.random() * 10000) + 5000,
      storageUsed: `${Math.floor(Math.random() * 500) + 100} MB`,
      connectionCount: Math.floor(Math.random() * 20) + 5,
      queryPerformance: {
        averageTime: Math.floor(Math.random() * 100) + 50,
        slowQueries: Math.floor(Math.random() * 10),
      },
    };
  }

  async getServiceHealth(): Promise<ServiceHealth> {
    // Mock implementation - replace with actual health checks
    return {
      nestjs: {
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 50) + 10,
      },
      database: {
        status: Math.random() > 0.1 ? 'healthy' : 'unhealthy',
        responseTime: Math.floor(Math.random() * 100) + 20,
      },
      mcp: {
        status: Math.random() > 0.2 ? 'healthy' : 'unhealthy',
        responseTime: Math.floor(Math.random() * 200) + 50,
      },
      mastra: {
        status: Math.random() > 0.2 ? 'healthy' : 'unhealthy',
        responseTime: Math.floor(Math.random() * 300) + 100,
      },
    };
  }
} 