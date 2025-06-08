import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend applications
  app.enableCors({
    origin: [
      'http://localhost:5173', // Qwik frontend
      'http://localhost:5174', // Alternative Qwik port
      'http://localhost:3000', // Same origin
      'http://localhost:8081', // MCP Bridge
      'http://localhost:4111', // Mastra AI
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 NestJS Scraper is running on http://localhost:${port}`);
}
bootstrap();
