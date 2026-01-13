import { AppError } from '../src/middleware/errorHandler';

console.log('Running error handler tests...\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.log(`✗ ${message}`);
    testsFailed++;
  }
}

// Test 1: AppError creation
function testAppErrorCreation(): void {
  const error = new AppError(404, 'Not found');
  
  assert(error.statusCode === 404, 'Status code should be 404');
  assert(error.message === 'Not found', 'Message should be "Not found"');
  assert(error.isOperational === true, 'Should be operational by default');
  assert(error instanceof Error, 'Should be instance of Error');
}

// Test 2: AppError with non-operational flag
function testNonOperationalError(): void {
  const error = new AppError(500, 'Server error', false);
  
  assert(error.isOperational === false, 'Should be non-operational');
}

// Test 3: Error has stack trace
function testStackTrace(): void {
  const error = new AppError(400, 'Bad request');
  
  assert(error.stack !== undefined, 'Should have stack trace');
  assert(typeof error.stack === 'string', 'Stack trace should be a string');
}

// Run all tests
testAppErrorCreation();
testNonOperationalError();
testStackTrace();

console.log(`\nTest Results: ${testsPassed} passed, ${testsFailed} failed`);

if (testsFailed > 0) {
  process.exit(1);
}
