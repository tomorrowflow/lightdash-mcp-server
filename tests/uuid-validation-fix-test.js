/**
 * Test script to verify UUID validation and error handling fixes
 */

import { isValidUUID, handleZodValidationError } from '../src/utils/error-handling.js';

console.log('🧪 Testing UUID Validation and Error Handling Fixes\n');

// Test 1: UUID Validation
console.log('1. Testing UUID validation:');
const validUUID = '123e4567-e89b-12d3-a456-426614174000';
const invalidUUID = 'invalid-uuid';
const emptyUUID = '';
const nullUUID = null;

console.log(`   Valid UUID (${validUUID}): ${isValidUUID(validUUID) ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Invalid UUID (${invalidUUID}): ${!isValidUUID(invalidUUID) ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Empty UUID: ${!isValidUUID(emptyUUID) ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Null UUID: ${!isValidUUID(nullUUID) ? '✅ PASS' : '❌ FAIL'}`);

// Test 2: Zod Error Handling
console.log('\n2. Testing Zod error handling:');
const mockZodError = {
  name: 'ZodError',
  errors: [
    {
      path: ['dashboardUuid'],
      message: 'Invalid uuid',
      code: 'invalid_string',
      validation: 'uuid'
    },
    {
      path: ['chartUuid'],
      message: 'Required',
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined'
    }
  ]
};

try {
  const errorMessage = handleZodValidationError(mockZodError);
  console.log(`   Zod error handling: ✅ PASS`);
  console.log(`   Error message: "${errorMessage}"`);
} catch (error) {
  console.log(`   Zod error handling: ❌ FAIL - ${error.message}`);
}

// Test 3: Simulate the original error scenarios
console.log('\n3. Testing error scenarios that were failing:');

// Simulate invalid UUID error
try {
  if (!isValidUUID('invalid-dashboard-uuid')) {
    throw new Error('Invalid dashboard UUID format: invalid-dashboard-uuid. Please provide a valid UUID.');
  }
} catch (error) {
  console.log(`   Invalid UUID handling: ✅ PASS`);
  console.log(`   Error message: "${error.message}"`);
}

// Simulate Zod validation error for chart UUID
try {
  const chartUuidError = {
    name: 'ZodError',
    errors: [
      {
        path: ['chartUuid'],
        message: 'Invalid uuid',
        code: 'invalid_string',
        validation: 'uuid'
      }
    ]
  };
  
  const errorMessage = handleZodValidationError(chartUuidError);
  console.log(`   Chart UUID validation error: ✅ PASS`);
  console.log(`   Error message: "${errorMessage}"`);
} catch (error) {
  console.log(`   Chart UUID validation error: ❌ FAIL - ${error.message}`);
}

console.log('\n✅ All UUID validation and error handling tests completed!');
console.log('\n📋 Summary of fixes applied:');
console.log('   • Added centralized UUID validation function');
console.log('   • Improved Zod error handling with user-friendly messages');
console.log('   • Added UUID format validation before API calls');
console.log('   • Enhanced error messages for HTTP status codes');
console.log('   • Fixed hardcoded project UUIDs in smart templates');
console.log('   • Added proper try-catch blocks for validation errors');