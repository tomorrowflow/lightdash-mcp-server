# lightdash-mcp-server
[![smithery badge](https://smithery.ai/badge/@syucream/lightdash-mcp-server)](https://smithery.ai/server/@syucream/lightdash-mcp-server)
[![npm version](https://badge.fury.io/js/lightdash-mcp-server.svg)](https://badge.fury.io/js/lightdash-mcp-server)

A [MCP(Model Context Protocol)](https://www.anthropic.com/news/model-context-protocol) server that accesses to [Lightdash](https://www.lightdash.com/).

This server provides MCP-compatible access to Lightdash's API, allowing AI assistants to interact with your Lightdash data through a standardized interface.

<a href="https://glama.ai/mcp/servers/e1gbb6sflq">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/e1gbb6sflq/badge" alt="Lightdash Server MCP server" />
</a>

## Features

This server provides comprehensive access to Lightdash's API with **19 tools**, **4 resources**, and **3 guided prompts** for AI-driven data analysis.

### 🛠️ Available Tools (19 total)

#### Core Data Analysis Tools (Enhanced)
- `lightdash_run_underlying_data_query` - **Execute queries against explores and return actual data results** ⭐ *Most Critical*
- `lightdash_get_catalog_search` - **Search across all catalog items** (explores, fields, dashboards, charts) with filtering and pagination
- `lightdash_get_explore_with_full_schema` - **Get complete explore schema** with all metrics and dimensions - essential for building queries
- `lightdash_get_explores_summary` - **List all available explores** with basic metadata - fast way to discover data models
- `lightdash_get_saved_chart_results` - **Get results from existing saved charts** with applied filters - leverage existing analyst work
- `lightdash_get_dashboard_by_uuid` - **Get complete dashboard details** including all tiles and configuration

#### Project & Organization Management
- `lightdash_list_projects` - List all projects in the Lightdash organization
- `lightdash_get_project` - Get details of a specific project
- `lightdash_list_spaces` - List all spaces in a project
- `lightdash_list_charts` - List all charts in a project
- `lightdash_list_dashboards` - List all dashboards in a project
- `lightdash_get_user_attributes` - Get organization user attributes

#### Data Catalog & Metadata
- `lightdash_get_catalog` - Get full catalog for a project
- `lightdash_get_metrics_catalog` - Get metrics catalog for a project
- `lightdash_get_custom_metrics` - Get custom metrics for a project
- `lightdash_get_metadata` - Get metadata for specific tables in the data catalog
- `lightdash_get_analytics` - Get analytics for specific tables in the data catalog

#### Export & Code Generation
- `lightdash_get_charts_as_code` - Get charts as code for a project
- `lightdash_get_dashboards_as_code` - Get dashboards as code for a project

### 📚 MCP Resources (4 total)

URI-based read-only access to Lightdash data using the custom `lightdash://` protocol:

- `lightdash://projects/{projectUuid}/catalog` - **Searchable catalog** of all items in project (explores, fields, dashboards, charts)
- `lightdash://projects/{projectUuid}/explores/{exploreId}/schema` - **Complete explore schema** with all metrics and dimensions
- `lightdash://dashboards/{dashboardUuid}` - **Dashboard structure** and tiles configuration
- `lightdash://charts/{chartUuid}` - **Saved chart configuration** and metadata

### 📝 MCP Prompts (3 total)

Guided workflow templates for common analysis patterns:

- `analyze-metric` - **Guided metric analysis workflow** - analyze a specific metric with dimensions and filters
- `find-and-explore` - **Discover and analyze data workflow** - find relevant data and suggest analysis approach
- `dashboard-deep-dive` - **Comprehensive dashboard analysis workflow** - analyze all tiles in a dashboard

### 🚀 Key Capabilities

**What makes this server powerful:**
- ⚡ **Execute actual data queries** - Not just metadata, but real analysis results
- 🔍 **Intelligent discovery** - Semantic search across all Lightdash content
- 📊 **Complete schema access** - Full field definitions for building queries
- 🎯 **Guided workflows** - AI-friendly templates for common analysis patterns
- 🔗 **URI-based access** - Direct data access via custom protocol
- 📈 **Leverage existing work** - Access saved charts and dashboards created by analysts

## Quick Start

### Installation

#### Installing via Smithery

To install Lightdash MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@syucream/lightdash-mcp-server):

```bash
npx -y @smithery/cli install lightdash-mcp-server --client claude
```

#### Manual Installation
```bash
npm install lightdash-mcp-server
```

### Configuration

#### Required Environment Variables

- `LIGHTDASH_API_KEY`: Your Lightdash Personal Access Token (PAT)
- `LIGHTDASH_API_URL`: The API base URL (default: `https://app.lightdash.cloud`)

#### Optional Environment Variables

- `CORS_ORIGIN`: Configure CORS origin for HTTP transport (default: `*`)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts for DNS protection (default: `localhost,127.0.0.1`)
- `CONNECTION_TIMEOUT`: Connection timeout in milliseconds (default: `30000`)
- `MAX_RETRIES`: Maximum number of retry attempts for failed requests (default: `3`)
- `RETRY_DELAY`: Initial delay between retries in milliseconds (default: `1000`)
- `HTTP_PORT`: Default HTTP port when using `-port` argument is not provided

### Usage

The lightdash-mcp-server supports two transport modes: **Stdio** (default) and **HTTP**.

#### Stdio Transport (Default)

1. Start the MCP server:

```bash
npx lightdash-mcp-server
```

2. Edit your MCP configuration json:
```json
...
    "lightdash": {
      "command": "npx",
      "args": [
        "-y",
        "lightdash-mcp-server"
      ],
      "env": {
        "LIGHTDASH_API_KEY": "<your PAT>",
        "LIGHTDASH_API_URL": "https://<your base url>"
      }
    },
...
```

#### HTTP Transport (Streamable HTTP)

1. Start the MCP server in HTTP mode:

```bash
npx lightdash-mcp-server -port 8088
```

This starts the server using StreamableHTTPServerTransport, making it accessible via HTTP at `http://localhost:8088/mcp`.

2. Configure your MCP client to connect via HTTP:

**For Claude Desktop and other MCP clients:**

Edit your MCP configuration json to use the `url` field instead of `command` and `args`:

```json
...
    "lightdash": {
      "url": "http://localhost:8088/mcp"
    },
...
```

**For programmatic access:**

Use the streamable HTTP client transport:
```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:8088/mcp')
);

await client.connect(transport);
```

**Note:** When using HTTP mode, ensure the environment variables `LIGHTDASH_API_KEY` and `LIGHTDASH_API_URL` are set in the environment where the server is running, as they cannot be passed through MCP client configuration.

See `examples/list_spaces_http.ts` for a complete example of connecting to the HTTP server programmatically.

### Health Check Endpoint

When running in HTTP mode, the server provides an enhanced health check endpoint at `/health` that includes:

- **Basic health status**: `healthy`, `degraded`, or `unhealthy`
- **Lightdash API connectivity test**: Verifies connection to Lightdash API
- **Error rate monitoring**: Tracks and reports error rates over time
- **Performance metrics**: Response times and system status
- **Version information**: Current server version

Example health check response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "0.0.12",
  "responseTime": 245,
  "errorRate": 0,
  "lightdashConnected": true,
  "projectCount": 5
}
```

### Security Features

The HTTP transport includes several security enhancements:

- **CORS protection**: Configurable cross-origin resource sharing
- **Host validation**: DNS rebinding protection with allowlist
- **Error rate limiting**: Automatic degradation detection
- **Graceful shutdown**: Proper cleanup on process termination

## Development

### Available Scripts

- `npm run dev` - Start the server in development mode with hot reloading (stdio transport)
- `npm run dev:http` - Start the server in development mode with HTTP transport on port 8088
- `npm run build` - Build the project for production
- `npm run start` - Start the production server
- `npm test` - Run comprehensive validation tests for all functionality
- `npm run test:build` - Build and run tests on production build
- `npm run lint` - Run linting checks (ESLint and Prettier)
- `npm run fix` - Automatically fix linting issues
- `npm run examples` - Run the example scripts

### Testing

The project includes a comprehensive test suite that validates:

- **All 19 MCP tools**: Ensures each tool responds correctly with proper data
- **4 MCP resources**: Tests URI-based data access with `lightdash://` protocol
- **3 MCP prompts**: Validates guided workflow template generation
- **Query execution**: Tests actual data querying with nested response parsing
- **Intelligent discovery**: Validates catalog search and schema retrieval
- **HTTP and Stdio transports**: Tests both communication methods
- **Security features**: Validates CORS and host validation
- **Performance**: Checks response times and concurrent handling
- **Health monitoring**: Tests the enhanced health check endpoint
- **Error handling**: Verifies proper MCP error codes and retry logic

Run the test suite:
```bash
npm test
```

**Specialized test commands:**
```bash
# Test specific functionality
npm run test:query        # Test query execution tools
npm run test:resources    # Test MCP resources and prompts
npm run test:discovery    # Test catalog search and schema tools
```

The tests will automatically start a test server, run all validations, and provide a detailed report of results including:
- ✅ **19 tools** validated with real Lightdash API calls
- ✅ **4 resources** tested with URI parsing and data access
- ✅ **3 prompts** verified with template generation
- ✅ **Query execution** confirmed with nested response parsing
- ✅ **Error handling** validated with proper MCP error codes

### Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests and linting: `npm run lint`
4. Commit your changes
5. Push to the branch
6. Create a Pull Request
