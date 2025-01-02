import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLightdashClient } from '@syucream/lightdash-client-typescript-fetch';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  ListProjectsSchema,
  GetProjectSchema,
  ListSpacesSchema,
  ListChartsSchema,
  ListDashboardsSchema,
} from './schemas.js';

// Initialize Lightdash API client
const lightdashClient = createLightdashClient(
  process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud/api/v1',
  {
    headers: {
      Authorization: `ApiKey ${process.env.LIGHTDASH_API_KEY}`,
    },
  }
);

// Initialize MCP server
const server = new Server(
  {
    name: 'lightdash-mcp-server',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle listTools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_projects',
        description: 'List all projects in the Lightdash organization',
        inputSchema: zodToJsonSchema(ListProjectsSchema),
      },
      {
        name: 'get_project',
        description: 'Get details of a specific project',
        inputSchema: zodToJsonSchema(GetProjectSchema),
      },
      {
        name: 'list_spaces',
        description: 'List all spaces in a project',
        inputSchema: zodToJsonSchema(ListSpacesSchema),
      },
      {
        name: 'list_charts',
        description: 'List all charts in a project',
        inputSchema: zodToJsonSchema(ListChartsSchema),
      },
      {
        name: 'list_dashboards',
        description: 'List all dashboards in a project',
        inputSchema: zodToJsonSchema(ListDashboardsSchema),
      },
    ],
  };
});

// Handle callTool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error('Arguments are required');
    }

    switch (request.params.name) {
      case 'list_projects': {
        const response = await lightdashClient.GET('/api/v1/org/projects');
        if (!response.data) {
          throw new Error('Failed to list projects');
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data.results, null, 2),
            },
          ],
        };
      }

      case 'get_project': {
        const args = GetProjectSchema.parse(request.params.arguments);
        const response = await lightdashClient.GET(
          '/api/v1/projects/{projectUuid}',
          {
            params: { path: { projectUuid: args.projectUuid } },
          }
        );
        if (!response.data) {
          throw new Error('Failed to get project');
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data.results, null, 2),
            },
          ],
        };
      }

      case 'list_spaces': {
        const args = ListSpacesSchema.parse(request.params.arguments);
        const response = await lightdashClient.GET(
          '/api/v1/projects/{projectUuid}/spaces',
          {
            params: { path: { projectUuid: args.projectUuid } },
          }
        );
        if (!response.data) {
          throw new Error('Failed to list spaces');
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data.results, null, 2),
            },
          ],
        };
      }

      case 'list_charts': {
        const args = ListChartsSchema.parse(request.params.arguments);
        const response = await lightdashClient.GET(
          '/api/v1/projects/{projectUuid}/charts',
          {
            params: { path: { projectUuid: args.projectUuid } },
          }
        );
        if (!response.data) {
          throw new Error('Failed to list charts');
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data.results, null, 2),
            },
          ],
        };
      }

      case 'list_dashboards': {
        const args = ListDashboardsSchema.parse(request.params.arguments);
        const response = await lightdashClient.GET(
          '/api/v1/projects/{projectUuid}/dashboards',
          {
            params: { path: { projectUuid: args.projectUuid } },
          }
        );
        if (!response.data) {
          throw new Error('Failed to list dashboards');
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data.results, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error: unknown) {
    console.error('Error handling request:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(errorMessage);
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Lightdash MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
