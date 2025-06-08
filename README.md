# F4S AI Scraper - Monorepo

A comprehensive web scraping solution built with multiple technologies and architectures, featuring AI-powered content analysis and monitoring capabilities.

## 🏗️ Architecture Overview

This monorepo contains four different scraper implementations, each designed for specific use cases and built with different technologies:

### Applications

1. **[Mastra Scraper](./mastra-scraper/)** - AI-powered scraper with agents and workflows
2. **[NestJS Scraper](./nest-scraper/)** - Enterprise-grade scraper with modular architecture
3. **[Qwik Scraper](./qwik-scraper/)** - High-performance frontend with modern web technologies
4. **[MCP Server](./mcp-server/)** - Model Context Protocol server for AI integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn or pnpm
- Git

### Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/AngularNxDev/f4s-scraper.git
cd f4s-scraper
```

2. Install dependencies for all applications:
```bash
# Install dependencies for each app
cd mastra-scraper && npm install && cd ..
cd nest-scraper && npm install && cd ..
cd qwik-scraper && npm install && cd ..
cd mcp-server && npm install && cd ..
```

3. Set up environment variables (see individual app READMEs for specific requirements)

4. Start all services:
```bash
# On Windows
.\start-all-services.ps1

# Or start individual services
cd nest-scraper && npm run start:dev &
cd qwik-scraper && npm run dev &
cd mastra-scraper && npm run dev &
cd mcp-server && npm run start &
```

## 📁 Project Structure

```
f4s-ai-scraper/
├── mastra-scraper/          # AI-powered scraper with Mastra framework
│   ├── src/
│   │   ├── agents/          # AI agents for scraping tasks
│   │   ├── tools/           # Scraping and analysis tools
│   │   └── workflows/       # Automated workflows
│   └── README.md
├── nest-scraper/            # Enterprise NestJS scraper
│   ├── src/
│   │   ├── modules/
│   │   │   ├── scraper/     # Core scraping functionality
│   │   │   ├── dashboard/   # Management dashboard
│   │   │   ├── scheduler/   # Job scheduling
│   │   │   └── supabase/    # Database integration
│   │   └── types/           # TypeScript definitions
│   └── test/
├── qwik-scraper/            # High-performance Qwik frontend
│   ├── apps/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── routes/          # Application routes
│   │   └── lib/             # Utilities and helpers
│   └── public/
├── mcp-server/              # Model Context Protocol server
│   └── src/
├── project-setup.md         # Detailed setup instructions
├── start-all-services.ps1  # Windows service startup script
└── SYSTEM_IMPROVEMENTS.md  # Enhancement roadmap
```

## 🔧 Development

### Running Individual Applications

Each application can be run independently:

- **Mastra Scraper**: `cd mastra-scraper && npm run dev`
- **NestJS Scraper**: `cd nest-scraper && npm run start:dev`
- **Qwik Scraper**: `cd qwik-scraper && npm run dev`
- **MCP Server**: `cd mcp-server && npm run start`

### Testing

Run tests for all applications:
```bash
# Run tests in each application
cd nest-scraper && npm run test
cd qwik-scraper && npm run test
cd mastra-scraper && npm run test
cd mcp-server && npm run test
```

## 🌟 Key Features

- **Multi-Architecture**: Four different implementations for various use cases
- **AI Integration**: Advanced AI-powered content analysis and extraction
- **Scalable**: Enterprise-ready with proper error handling and monitoring
- **Real-time**: Live monitoring and dashboard capabilities
- **Modular**: Clean separation of concerns across different services
- **Type-Safe**: Full TypeScript support across all applications

## 📚 Documentation

- [Project Setup Guide](./project-setup.md)
- [System Improvements Roadmap](./SYSTEM_IMPROVEMENTS.md)
- [Mastra Scraper Documentation](./mastra-scraper/README.md)
- [NestJS Scraper Documentation](./nest-scraper/README.md)
- [Qwik Scraper Documentation](./qwik-scraper/README.md)
- [MCP Server Documentation](./mcp-server/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: [https://github.com/AngularNxDev/f4s-scraper](https://github.com/AngularNxDev/f4s-scraper)
- **Issues**: [https://github.com/AngularNxDev/f4s-scraper/issues](https://github.com/AngularNxDev/f4s-scraper/issues)
- **Documentation**: See individual application READMEs

## 🏷️ Tags

`web-scraping` `ai` `nestjs` `qwik` `mastra` `typescript` `monorepo` `mcp-server` `content-analysis` 