# MCP Server

A Model Context Protocol (MCP) server implementation using the official SDK.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your MCP settings:
   - Create a `.env` file in the root directory
   - Add your MCP configuration (API key, endpoint, etc.)

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Endpoints

- `GET /health` - Health check endpoint

## Configuration

The server can be configured through environment variables:

- `PORT` - Server port (default: 3000)
- `MCP_API_KEY` - Your MCP API key
- `MCP_ENDPOINT` - Your MCP endpoint

## License

MIT 