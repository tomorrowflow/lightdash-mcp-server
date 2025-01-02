# lightdash-mcp-server

A [MCP(Model Context Protocol)](https://www.anthropic.com/news/model-context-protocol) server that accesses to [Lightdash](https://www.lightdash.com/).

This server provides MCP-compatible access to Lightdash's API, allowing AI assistants to interact with your Lightdash data through a standardized interface.

## Features

- **Project Management**
  - List all projects in your Lightdash organization
  - Get detailed information about specific projects
- **Content Access**
  - List spaces within a project
  - List charts within a project
  - List dashboards within a project

## Quick Start

### Installation

```bash
npm install @syucream/lightdash-mcp-server
```

### Configuration

Create a `.env` file with your Lightdash API credentials:

```env
LIGHTDASH_API_KEY=your_api_key
LIGHTDASH_API_URL=https://app.lightdash.cloud/api/v1  # or your custom Lightdash instance URL
```

### Usage

1. Start the MCP server:
```bash
npx lightdash-mcp-server
```

2. For example usage, check the `examples` directory. To run the example:
```bash
# Set required environment variables
export EXAMPLES_CLIENT_LIGHTDASH_API_KEY=your_api_key
export EXAMPLES_CLIENT_LIGHTDASH_PROJECT_UUID=your_project_uuid

# Run the example
npm run examples
```

## Development

### Available Scripts

- `npm run dev` - Start the server in development mode with hot reloading
- `npm run build` - Build the project for production
- `npm run start` - Start the production server
- `npm run lint` - Run linting checks (ESLint and Prettier)
- `npm run fix` - Automatically fix linting issues
- `npm run examples` - Run the example scripts

### Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests and linting: `npm run lint`
4. Commit your changes
5. Push to the branch
6. Create a Pull Request
