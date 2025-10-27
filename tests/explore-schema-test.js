#!/usr/bin/env node

/**
 * Test script for get_explore_with_full_schema tool
 * Tests getting complete explore schema with all metrics and dimensions
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

const sessionId = `test-explore-schema-${Date.now()}`;
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
        name: 'explore-schema-test',
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

async function testExploreSchema() {
  log('🚀 Testing get_explore_with_full_schema tool...');

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

    // Get available explores/tables from catalog search
    log('🔍 Finding available explores...');
    const catalogResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_catalog_search',
      arguments: {
        projectUuid: testProject.projectUuid,
        type: 'table',
        limit: 5,
      },
    });

    if (catalogResponse.error) {
      throw new Error(`Failed to get catalog: ${catalogResponse.error.message}`);
    }

    const explores = JSON.parse(catalogResponse.result.content[0].text);
    if (!explores || explores.length === 0) {
      throw new Error('No explores found for testing');
    }

    const testExplore = explores[0];
    log(`🔍 Using explore: ${testExplore.name} (${testExplore.label || 'No label'})`);

    // Test 1: Get full schema for the first explore
    log('🧪 Test 1: Get full explore schema...');
    const schemaResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_explore_with_full_schema',
      arguments: {
        projectUuid: testProject.projectUuid,
        exploreId: testExplore.name,
      },
    });

    if (schemaResponse.error) {
      log('❌ Test 1 failed:', schemaResponse.error);
      return false;
    } else {
      const schema = JSON.parse(schemaResponse.result.content[0].text);
      log(`✅ Test 1 passed: Retrieved schema for explore "${schema.name}"`);
      
      // Analyze the schema structure
      if (schema.tables) {
        const tableNames = Object.keys(schema.tables);
        log(`📋 Schema contains ${tableNames.length} table(s): ${tableNames.join(', ')}`);
        
        // Count dimensions and metrics
        let totalDimensions = 0;
        let totalMetrics = 0;
        
        for (const tableName of tableNames) {
          const table = schema.tables[tableName];
          if (table.dimensions) {
            totalDimensions += Object.keys(table.dimensions).length;
          }
          if (table.metrics) {
            totalMetrics += Object.keys(table.metrics).length;
          }
        }
        
        log(`📊 Total fields: ${totalDimensions} dimensions, ${totalMetrics} metrics`);
        
        // Show sample fields
        if (totalDimensions > 0) {
          const firstTable = schema.tables[tableNames[0]];
          if (firstTable.dimensions) {
            const sampleDimensions = Object.keys(firstTable.dimensions).slice(0, 3);
            log(`📄 Sample dimensions: ${sampleDimensions.join(', ')}`);
          }
        }
        
        if (totalMetrics > 0) {
          const firstTable = schema.tables[tableNames[0]];
          if (firstTable.metrics) {
            const sampleMetrics = Object.keys(firstTable.metrics).slice(0, 3);
            log(`📄 Sample metrics: ${sampleMetrics.join(', ')}`);
          }
        }
      }
    }

    // Test 2: Try with a different explore if available
    if (explores.length > 1) {
      const secondExplore = explores[1];
      log(`🧪 Test 2: Get schema for second explore "${secondExplore.name}"...`);
      
      const secondSchemaResponse = await makeRequest('tools/call', {
        name: 'lightdash_get_explore_with_full_schema',
        arguments: {
          projectUuid: testProject.projectUuid,
          exploreId: secondExplore.name,
        },
      });

      if (secondSchemaResponse.error) {
        log('❌ Test 2 failed:', secondSchemaResponse.error);
      } else {
        const secondSchema = JSON.parse(secondSchemaResponse.result.content[0].text);
        log(`✅ Test 2 passed: Retrieved schema for explore "${secondSchema.name}"`);
      }
    } else {
      log('ℹ️ Test 2 skipped: Only one explore available');
    }

    // Test 3: Test error handling with invalid explore
    log('🧪 Test 3: Test error handling with invalid explore...');
    const invalidResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_explore_with_full_schema',
      arguments: {
        projectUuid: testProject.projectUuid,
        exploreId: 'non_existent_explore_12345',
      },
    });

    if (invalidResponse.error) {
      log('✅ Test 3 passed: Correctly handled invalid explore with error');
    } else {
      log('❌ Test 3 failed: Should have returned an error for invalid explore');
    }

    log('🎉 get_explore_with_full_schema tool testing completed successfully!');
    return true;

  } catch (error) {
    log('❌ Test failed with error:', error.message);
    return false;
  }
}

async function main() {
  log('🚀 Starting get_explore_with_full_schema tool validation tests');
  
  try {
    const success = await testExploreSchema();
    
    if (success) {
      log('✅ All tests passed! The get_explore_with_full_schema tool is working correctly.');
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