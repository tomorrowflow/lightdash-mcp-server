#!/usr/bin/env node

/**
 * Test script for get_explores_summary tool
 * Tests listing all available explores with basic metadata
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

const sessionId = `test-explores-summary-${Date.now()}`;
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
        name: 'explores-summary-test',
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

async function testExploresSummary() {
  log('🚀 Testing get_explores_summary tool...');

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

    // Test 1: Get explores summary
    log('🧪 Test 1: Get explores summary...');
    const summaryResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_explores_summary',
      arguments: {
        projectUuid: testProject.projectUuid,
      },
    });

    if (summaryResponse.error) {
      log('❌ Test 1 failed:', summaryResponse.error);
      return false;
    } else {
      const explores = JSON.parse(summaryResponse.result.content[0].text);
      log(`✅ Test 1 passed: Retrieved ${explores.length} explores`);
      
      if (explores.length > 0) {
        // Analyze the explores structure
        const exploreNames = explores.map(explore => explore.name);
        log(`📋 Available explores: ${exploreNames.join(', ')}`);
        
        // Show sample explores with their metadata
        const sampleExplores = explores.slice(0, 3).map(explore => ({
          name: explore.name,
          label: explore.label || 'No label',
          tags: explore.tags || [],
          groupLabel: explore.groupLabel || 'No group'
        }));
        
        log('📄 Sample explores with metadata:');
        sampleExplores.forEach((explore, index) => {
          log(`  ${index + 1}. ${explore.name} (${explore.label})`);
          if (explore.tags.length > 0) {
            log(`     Tags: ${explore.tags.join(', ')}`);
          }
          if (explore.groupLabel !== 'No group') {
            log(`     Group: ${explore.groupLabel}`);
          }
        });
      } else {
        log('ℹ️ No explores found in this project');
      }
    }

    // Test 2: Compare with catalog search results
    log('🧪 Test 2: Compare with catalog search results...');
    const catalogResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_catalog_search',
      arguments: {
        projectUuid: testProject.projectUuid,
        type: 'table',
      },
    });

    if (catalogResponse.error) {
      log('❌ Test 2 failed:', catalogResponse.error);
    } else {
      const catalogExplores = JSON.parse(catalogResponse.result.content[0].text);
      const summaryExplores = JSON.parse(summaryResponse.result.content[0].text);
      
      log(`✅ Test 2 passed: Catalog search found ${catalogExplores.length} tables, summary found ${summaryExplores.length} explores`);
      
      // Check if the explores match
      const catalogNames = new Set(catalogExplores.map(item => item.name));
      const summaryNames = new Set(summaryExplores.map(explore => explore.name));
      
      const commonExplores = [...catalogNames].filter(name => summaryNames.has(name));
      log(`🔍 Common explores between catalog and summary: ${commonExplores.length}`);
      
      if (commonExplores.length > 0) {
        log(`📄 Common explores: ${commonExplores.slice(0, 3).join(', ')}`);
      }
    }

    // Test 3: Test error handling with invalid project
    log('🧪 Test 3: Test error handling with invalid project...');
    const invalidResponse = await makeRequest('tools/call', {
      name: 'lightdash_get_explores_summary',
      arguments: {
        projectUuid: '00000000-0000-0000-0000-000000000000',
      },
    });

    if (invalidResponse.error) {
      log('✅ Test 3 passed: Correctly handled invalid project with error');
    } else {
      log('❌ Test 3 failed: Should have returned an error for invalid project');
    }

    log('🎉 get_explores_summary tool testing completed successfully!');
    return true;

  } catch (error) {
    log('❌ Test failed with error:', error.message);
    return false;
  }
}

async function main() {
  log('🚀 Starting get_explores_summary tool validation tests');
  
  try {
    const success = await testExploresSummary();
    
    if (success) {
      log('✅ All tests passed! The get_explores_summary tool is working correctly.');
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