/**
 * MCP Server configuration and setup
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package.json version for fallback
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', '..', 'package.json');

let packageVersion = '0.0.1'; // Default fallback
try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  packageVersion = packageJson.version || '0.0.1';
} catch {
  console.warn(
    'Could not read package.json version, using default:',
    packageVersion
  );
}

// Configuration with environment variable support
export const serverName = process.env.MCP_SERVER_NAME || 'lightdash-mcp-server';
export const serverVersion = process.env.MCP_SERVER_VERSION || packageVersion;

// Server configuration object
export const serverConfig = {
  info: {
    name: serverName,
    version: serverVersion,
    protocolVersion: '2025-06-18',
  },
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
  },
};

// Export individual config values for convenience
export { packageVersion };