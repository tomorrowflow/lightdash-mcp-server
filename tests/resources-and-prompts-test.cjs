#!/usr/bin/env node

/**
 * Comprehensive test for MCP Resources and Prompts functionality
 * Tests the new Phase 4 and Phase 5 implementations
 */

const { execSync } = require('child_process');

// Test configuration
const SERVER_URL = 'http://localhost:3000/mcp';
const SESSION_ID = `resources-prompts-test-${Date.now()}`;

// Test data
const TEST_PROJECT_UUID = 'b5a65d5a-63a0-4cf5-a2fc-332f4eb42141';
const TEST_EXPLORE_ID = 'harvest_clients';
const TEST_DASHBOARD_UUID = '550e8400-e29b-41d4-a716-446655440000'; // Fallback UUID
const TEST_CHART_UUID = '550e8400-e29b-41d4-a716-446655440001'; // Fallback UUID

console.log('🧪 LIGHTDASH MCP RESOURCES AND PROMPTS TEST');
console.log('='.repeat(60));

/**
 * Execute MCP request
 */
function mcpRequest(method, params = {}) {
  const payload = {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1000),
    method,
    params
  };

  const curlCommand = `curl -s -X POST ${SERVER_URL} \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json, text/event-stream" \\
    -H "mcp-session-id: ${SESSION_ID}" \\
    -d '${JSON.stringify(payload)}'`;

  try {
    const result = execSync(curlCommand, { encoding: 'utf-8' });
    return JSON.parse(result);
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { error: { message: error.message } };
  }
}

/**
 * Test MCP session initialization
 */
function testInitialization() {
  console.log('\n📋 Testing MCP Session Initialization...');
  
  const response = mcpRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'resources-prompts-test-client',
      version: '1.0.0'
    }
  });

  if (response.error) {
    console.log(`❌ Initialization failed: ${response.error.message}`);
    return false;
  }

  console.log('✅ Session initialized successfully');
  
  // Check if resources and prompts capabilities are advertised
  const capabilities = response.result?.capabilities || {};
  const hasResources = 'resources' in capabilities;
  const hasPrompts = 'prompts' in capabilities;
  
  console.log(`   📚 Resources capability: ${hasResources ? '✅ Available' : '❌ Missing'}`);
  console.log(`   📝 Prompts capability: ${hasPrompts ? '✅ Available' : '❌ Missing'}`);
  
  return hasResources && hasPrompts;
}

/**
 * Test Resources functionality
 */
function testResources() {
  console.log('\n📚 Testing MCP Resources...');
  
  // Test 1: List available resources
  console.log('   🔍 Testing resources/list...');
  const listResponse = mcpRequest('resources/list');
  
  if (listResponse.error) {
    console.log(`   ❌ Failed to list resources: ${listResponse.error.message}`);
    return false;
  }
  
  const resources = listResponse.result?.resources || [];
  console.log(`   ✅ Found ${resources.length} resources`);
  
  // Verify expected resources are present
  const expectedResources = [
    'lightdash://projects/{projectUuid}/catalog',
    'lightdash://projects/{projectUuid}/explores/{exploreId}/schema',
    'lightdash://dashboards/{dashboardUuid}',
    'lightdash://charts/{chartUuid}'
  ];
  
  let allResourcesFound = true;
  expectedResources.forEach(expectedUri => {
    const found = resources.some(r => r.uri === expectedUri);
    console.log(`   ${found ? '✅' : '❌'} ${expectedUri}`);
    if (!found) allResourcesFound = false;
  });
  
  if (!allResourcesFound) {
    console.log('   ❌ Some expected resources are missing');
    return false;
  }
  
  // Test 2: Read catalog resource
  console.log('   📖 Testing catalog resource read...');
  const catalogUri = `lightdash://projects/${TEST_PROJECT_UUID}/catalog?limit=2`;
  const catalogResponse = mcpRequest('resources/read', { uri: catalogUri });
  
  if (catalogResponse.error) {
    console.log(`   ❌ Failed to read catalog resource: ${catalogResponse.error.message}`);
    return false;
  }
  
  const catalogContents = catalogResponse.result?.contents?.[0];
  if (catalogContents && catalogContents.mimeType === 'application/json') {
    console.log('   ✅ Catalog resource read successfully');
    try {
      const catalogData = JSON.parse(catalogContents.text);
      console.log(`   📊 Catalog contains ${Array.isArray(catalogData) ? catalogData.length : 'unknown'} items`);
    } catch (e) {
      console.log('   ⚠️  Catalog data is not valid JSON');
    }
  } else {
    console.log('   ❌ Catalog resource format is incorrect');
    return false;
  }
  
  // Test 3: Read explore schema resource
  console.log('   📖 Testing explore schema resource read...');
  const schemaUri = `lightdash://projects/${TEST_PROJECT_UUID}/explores/${TEST_EXPLORE_ID}/schema`;
  const schemaResponse = mcpRequest('resources/read', { uri: schemaUri });
  
  if (schemaResponse.error) {
    console.log(`   ❌ Failed to read schema resource: ${schemaResponse.error.message}`);
    return false;
  }
  
  const schemaContents = schemaResponse.result?.contents?.[0];
  if (schemaContents && schemaContents.mimeType === 'application/json') {
    console.log('   ✅ Schema resource read successfully');
    try {
      const schemaData = JSON.parse(schemaContents.text);
      console.log(`   🔧 Schema for explore: ${schemaData.name || 'unknown'}`);
    } catch (e) {
      console.log('   ⚠️  Schema data is not valid JSON');
    }
  } else {
    console.log('   ❌ Schema resource format is incorrect');
    return false;
  }
  
  console.log('✅ Resources functionality working correctly');
  return true;
}

/**
 * Test Prompts functionality
 */
function testPrompts() {
  console.log('\n📝 Testing MCP Prompts...');
  
  // Test 1: List available prompts
  console.log('   🔍 Testing prompts/list...');
  const listResponse = mcpRequest('prompts/list');
  
  if (listResponse.error) {
    console.log(`   ❌ Failed to list prompts: ${listResponse.error.message}`);
    return false;
  }
  
  const prompts = listResponse.result?.prompts || [];
  console.log(`   ✅ Found ${prompts.length} prompts`);
  
  // Verify expected prompts are present
  const expectedPrompts = ['analyze-metric', 'find-and-explore', 'dashboard-deep-dive'];
  
  let allPromptsFound = true;
  expectedPrompts.forEach(expectedName => {
    const found = prompts.some(p => p.name === expectedName);
    console.log(`   ${found ? '✅' : '❌'} ${expectedName}`);
    if (!found) allPromptsFound = false;
  });
  
  if (!allPromptsFound) {
    console.log('   ❌ Some expected prompts are missing');
    return false;
  }
  
  // Test 2: Get analyze-metric prompt
  console.log('   📖 Testing analyze-metric prompt...');
  const analyzeResponse = mcpRequest('prompts/get', {
    name: 'analyze-metric',
    arguments: {
      metric_name: 'total_revenue',
      explore_name: 'orders',
      dimensions: 'created_date,status',
      date_range: 'last 30 days'
    }
  });
  
  if (analyzeResponse.error) {
    console.log(`   ❌ Failed to get analyze-metric prompt: ${analyzeResponse.error.message}`);
    return false;
  }
  
  const analyzePrompt = analyzeResponse.result;
  if (analyzePrompt?.messages?.[0]?.content?.text) {
    console.log('   ✅ Analyze-metric prompt generated successfully');
    console.log(`   📋 Description: ${analyzePrompt.description}`);
  } else {
    console.log('   ❌ Analyze-metric prompt format is incorrect');
    return false;
  }
  
  // Test 3: Get find-and-explore prompt
  console.log('   📖 Testing find-and-explore prompt...');
  const exploreResponse = mcpRequest('prompts/get', {
    name: 'find-and-explore',
    arguments: {
      business_question: 'What are our top performing products?',
      search_terms: 'product, sales, revenue'
    }
  });
  
  if (exploreResponse.error) {
    console.log(`   ❌ Failed to get find-and-explore prompt: ${exploreResponse.error.message}`);
    return false;
  }
  
  const explorePrompt = exploreResponse.result;
  if (explorePrompt?.messages?.[0]?.content?.text) {
    console.log('   ✅ Find-and-explore prompt generated successfully');
    console.log(`   📋 Description: ${explorePrompt.description}`);
  } else {
    console.log('   ❌ Find-and-explore prompt format is incorrect');
    return false;
  }
  
  // Test 4: Get dashboard-deep-dive prompt
  console.log('   📖 Testing dashboard-deep-dive prompt...');
  const dashboardResponse = mcpRequest('prompts/get', {
    name: 'dashboard-deep-dive',
    arguments: {
      dashboard_name: 'Sales Overview Dashboard'
    }
  });
  
  if (dashboardResponse.error) {
    console.log(`   ❌ Failed to get dashboard-deep-dive prompt: ${dashboardResponse.error.message}`);
    return false;
  }
  
  const dashboardPrompt = dashboardResponse.result;
  if (dashboardPrompt?.messages?.[0]?.content?.text) {
    console.log('   ✅ Dashboard-deep-dive prompt generated successfully');
    console.log(`   📋 Description: ${dashboardPrompt.description}`);
  } else {
    console.log('   ❌ Dashboard-deep-dive prompt format is incorrect');
    return false;
  }
  
  console.log('✅ Prompts functionality working correctly');
  return true;
}

/**
 * Test error handling
 */
function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test 1: Invalid resource URI
  console.log('   🔍 Testing invalid resource URI...');
  const invalidResponse = mcpRequest('resources/read', { uri: 'invalid://test' });
  
  if (invalidResponse.error) {
    console.log('   ✅ Invalid resource URI properly rejected');
  } else {
    console.log('   ❌ Invalid resource URI should have been rejected');
    return false;
  }
  
  // Test 2: Invalid prompt name
  console.log('   🔍 Testing invalid prompt name...');
  const invalidPromptResponse = mcpRequest('prompts/get', { name: 'invalid-prompt' });
  
  if (invalidPromptResponse.error) {
    console.log('   ✅ Invalid prompt name properly rejected');
  } else {
    console.log('   ❌ Invalid prompt name should have been rejected');
    return false;
  }
  
  console.log('✅ Error handling working correctly');
  return true;
}

/**
 * Main test execution
 */
function runTests() {
  let allTestsPassed = true;
  
  // Run all tests
  allTestsPassed &= testInitialization();
  allTestsPassed &= testResources();
  allTestsPassed &= testPrompts();
  allTestsPassed &= testErrorHandling();
  
  // Final results
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL RESOURCES AND PROMPTS TESTS PASSED!');
    console.log('✅ Phase 4 (Resources) implementation: WORKING');
    console.log('✅ Phase 5 (Prompts) implementation: WORKING');
    console.log('✅ URI-based data access: FUNCTIONAL');
    console.log('✅ Guided workflow templates: FUNCTIONAL');
    console.log('✅ Error handling: ROBUST');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('⚠️  Please check the implementation and try again');
  }
  
  return allTestsPassed;
}

// Execute tests
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };