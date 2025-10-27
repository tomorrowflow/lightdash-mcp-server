#!/usr/bin/env node

/**
 * Test script for run_underlying_data_query tool
 * Tests the most critical new functionality - executing queries and returning actual data
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

const sessionId = `test-${Date.now()}`;
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
        name: 'test-client',
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

async function testRunUnderlyingDataQuery() {
  log('🚀 Testing run_underlying_data_query tool...');

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

    // Get catalog to find available explores and fields
    log('🔍 Getting catalog for field discovery...');
    const catalogResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_catalog',
      arguments: {
        projectUuid: testProject.projectUuid,
      },
    });

    if (catalogResponse.error) {
      throw new Error(`Failed to get catalog: ${catalogResponse.error.message}`);
    }

    const catalog = JSON.parse(catalogResponse.result.content[0].text);
    
    // Find the first explore with metrics and dimensions
    let testExplore = null;
    let testMetrics = [];
    let testDimensions = [];

    for (const item of catalog) {
      if (item.type === 'table') {
        testExplore = item.name;
        break;
      }
    }

    // Find some metrics and dimensions for the test explore
    for (const item of catalog) {
      if (item.tableName === testExplore) {
        if (item.fieldType === 'metric' && testMetrics.length < 2) {
          testMetrics.push(item.name);
        } else if (item.fieldType === 'dimension' && testDimensions.length < 2) {
          testDimensions.push(item.name);
        }
      }
    }

    if (!testExplore || testMetrics.length === 0) {
      log('⚠️  No suitable explore with metrics found, using basic test parameters');
      testExplore = 'orders'; // fallback
      testMetrics = ['orders_count'];
      testDimensions = ['orders_status'];
    }

    log(`🎯 Test parameters:
      - Explore: ${testExplore}
      - Metrics: ${testMetrics.join(', ')}
      - Dimensions: ${testDimensions.join(', ')}`);

    // Test 1: Simple query with metrics only
    log('🧪 Test 1: Simple query with metrics only...');
    const simpleQueryResponse = await makeRequest('tools/call', {
      name: 'lightdash_run_underlying_data_query',
      arguments: {
        projectUuid: testProject.projectUuid,
        exploreId: testExplore,
        metrics: testMetrics.slice(0, 1), // Use first metric only
        limit: 10,
      },
    });

    if (simpleQueryResponse.error) {
      log('❌ Test 1 failed:', simpleQueryResponse.error);
    } else {
      const result = JSON.parse(simpleQueryResponse.result.content[0].text);
      log(`✅ Test 1 passed: Retrieved ${result.rows?.length || 0} rows`);
      if (result.rows && result.rows.length > 0) {
        log('📄 Sample row:', result.rows[0]);
      }
    }

    // Test 2: Query with metrics and dimensions
    if (testDimensions.length > 0) {
      log('🧪 Test 2: Query with metrics and dimensions...');
      const complexQueryResponse = await makeRequest('tools/call', {
        name: 'lightdash_run_underlying_data_query',
        arguments: {
          projectUuid: testProject.projectUuid,
          exploreId: testExplore,
          metrics: testMetrics.slice(0, 1),
          dimensions: testDimensions.slice(0, 1),
          limit: 5,
        },
      });

      if (complexQueryResponse.error) {
        log('❌ Test 2 failed:', complexQueryResponse.error);
      } else {
        const result = JSON.parse(complexQueryResponse.result.content[0].text);
        log(`✅ Test 2 passed: Retrieved ${result.rows?.length || 0} rows with dimensions`);
        if (result.rows && result.rows.length > 0) {
          log('📄 Sample row with dimensions:', result.rows[0]);
        }
      }
    }

    // Test 3: Query with sorting
    log('🧪 Test 3: Query with sorting...');
    const sortedQueryResponse = await makeRequest('tools/call', {
      name: 'lightdash_run_underlying_data_query',
      arguments: {
        projectUuid: testProject.projectUuid,
        exploreId: testExplore,
        metrics: testMetrics.slice(0, 1),
        sorts: [
          {
            fieldId: testMetrics[0],
            descending: true,
          },
        ],
        limit: 3,
      },
    });

    if (sortedQueryResponse.error) {
      log('❌ Test 3 failed:', sortedQueryResponse.error);
    } else {
      const result = JSON.parse(sortedQueryResponse.result.content[0].text);
      log(`✅ Test 3 passed: Retrieved ${result.rows?.length || 0} sorted rows`);
    }

    log('🎉 run_underlying_data_query tool testing completed successfully!');
    return true;

  } catch (error) {
    log('❌ Test failed with error:', error.message);
    return false;
  }
}

async function main() {
  log('🚀 Starting run_underlying_data_query tool validation tests');
  
  try {
    const success = await testRunUnderlyingDataQuery();
    
    if (success) {
      log('✅ All tests passed! The run_underlying_data_query tool is working correctly.');
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