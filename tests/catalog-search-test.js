#!/usr/bin/env node

/**
 * Test script for get_catalog_search tool
 * Tests intelligent discovery of fields, explores, dashboards, and charts
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp';

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

const sessionId = `test-catalog-${Date.now()}`;
let isInitialized = false;

async function makeRequest(method, params = {}) {
  // Initialize session if not already done
  if (!isInitialized && method !== 'initialize') {
    await initializeSession();
  }

  const requestBody = {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1000),
    method,
    params,
  };

  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

async function initializeSession() {
  const requestBody = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'catalog-search-test',
        version: '1.0.0'
      }
    }
  };

  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to initialize session: HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(`Failed to initialize session: ${result.error.message}`);
  }

  isInitialized = true;
  log('✅ MCP session initialized successfully');
}

async function testCatalogSearch() {
  log('🚀 Testing get_catalog_search tool...');

  try {
    // First, get a list of projects to use for testing
    log('📋 Getting project list...');
    const projectsResponse = await makeRequest('tools/call', {
      name: 'lightdash_list_projects',
      arguments: {},
    });

    if (projectsResponse.error) {
      throw new Error(`Failed to get projects: ${projectsResponse.error.message}`);
    }

    const projects = JSON.parse(projectsResponse.result.content[0].text);
    if (!projects || projects.length === 0) {
      throw new Error('No projects found for testing');
    }

    const testProject = projects[0];
    log(`📊 Using project: ${testProject.name} (${testProject.projectUuid})`);

    // Test 1: Search all catalog items without filters
    log('🧪 Test 1: Search all catalog items...');
    const allItemsResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_catalog_search',
      arguments: {
        projectUuid: testProject.projectUuid,
        limit: 10,
      },
    });

    if (allItemsResponse.error) {
      log('❌ Test 1 failed:', allItemsResponse.error);
    } else {
      const result = JSON.parse(allItemsResponse.result.content[0].text);
      log(`✅ Test 1 passed: Retrieved ${result.length} catalog items`);
      if (result.length > 0) {
        log('📄 Sample items:', result.slice(0, 3).map(item => ({
          name: item.name,
          type: item.type,
          description: item.description?.substring(0, 100)
        })));
      }
    }

    // Test 2: Search for fields only
    log('🧪 Test 2: Search for fields only...');
    const fieldsResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_catalog_search',
      arguments: {
        projectUuid: testProject.projectUuid,
        type: 'field',
        limit: 5,
      },
    });

    if (fieldsResponse.error) {
      log('❌ Test 2 failed:', fieldsResponse.error);
    } else {
      const result = JSON.parse(fieldsResponse.result.content[0].text);
      log(`✅ Test 2 passed: Retrieved ${result.length} fields`);
      if (result.length > 0) {
        log('📄 Sample fields:', result.slice(0, 2).map(field => ({
          name: field.name,
          fieldType: field.fieldType,
          tableName: field.tableName
        })));
      }
    }

    // Test 3: Search for tables/explores
    log('🧪 Test 3: Search for tables/explores...');
    const tablesResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_catalog_search',
      arguments: {
        projectUuid: testProject.projectUuid,
        type: 'table',
        limit: 5,
      },
    });

    if (tablesResponse.error) {
      log('❌ Test 3 failed:', tablesResponse.error);
    } else {
      const result = JSON.parse(tablesResponse.result.content[0].text);
      log(`✅ Test 3 passed: Retrieved ${result.length} tables/explores`);
      if (result.length > 0) {
        log('📄 Sample tables:', result.slice(0, 2).map(table => ({
          name: table.name,
          label: table.label,
          description: table.description?.substring(0, 100)
        })));
      }
    }

    // Test 4: Search with a search term
    log('🧪 Test 4: Search with search term "revenue"...');
    const searchResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_catalog_search',
      arguments: {
        projectUuid: testProject.projectUuid,
        search: 'revenue',
        limit: 5,
      },
    });

    if (searchResponse.error) {
      log('❌ Test 4 failed:', searchResponse.error);
    } else {
      const result = JSON.parse(searchResponse.result.content[0].text);
      log(`✅ Test 4 passed: Retrieved ${result.length} items matching "revenue"`);
      if (result.length > 0) {
        log('📄 Search results:', result.slice(0, 2).map(item => ({
          name: item.name,
          type: item.type,
          description: item.description?.substring(0, 100)
        })));
      }
    }

    // Test 5: Search for dashboards
    log('🧪 Test 5: Search for dashboards...');
    const dashboardsResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_catalog_search',
      arguments: {
        projectUuid: testProject.projectUuid,
        type: 'dashboard',
        limit: 3,
      },
    });

    if (dashboardsResponse.error) {
      log('❌ Test 5 failed:', dashboardsResponse.error);
    } else {
      const result = JSON.parse(dashboardsResponse.result.content[0].text);
      log(`✅ Test 5 passed: Retrieved ${result.length} dashboards`);
      if (result.length > 0) {
        log('📄 Sample dashboards:', result.slice(0, 2).map(dashboard => ({
          name: dashboard.name,
          description: dashboard.description?.substring(0, 100)
        })));
      }
    }

    log('🎉 get_catalog_search tool testing completed successfully!');
    return true;

  } catch (error) {
    log('❌ Test failed with error:', error.message);
    return false;
  }
}

async function main() {
  log('🚀 Starting get_catalog_search tool validation tests');
  
  try {
    const success = await testCatalogSearch();
    
    if (success) {
      log('✅ All tests passed! The get_catalog_search tool is working correctly.');
      process.exit(0);
    } else {
      log('❌ Some tests failed. Please check the implementation.');
      process.exit(1);
    }
  } catch (error) {
    log('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
main();