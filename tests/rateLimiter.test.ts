import { RateLimiter } from '../src/rateLimiter';

console.log('Running rate limiter tests...\n');

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Basic rate limiting
function testBasicRateLimiting(): void {
  const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 3 });
  
  assert(limiter.isAllowed('user1'), 'First request should be allowed');
  assert(limiter.isAllowed('user1'), 'Second request should be allowed');
  assert(limiter.isAllowed('user1'), 'Third request should be allowed');
  assert(!limiter.isAllowed('user1'), 'Fourth request should be blocked');
}

// Test 2: Multiple identifiers
function testMultipleIdentifiers(): void {
  const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 2 });
  
  assert(limiter.isAllowed('user1'), 'User1 first request allowed');
  assert(limiter.isAllowed('user2'), 'User2 first request allowed');
  assert(limiter.isAllowed('user1'), 'User1 second request allowed');
  assert(limiter.isAllowed('user2'), 'User2 second request allowed');
  assert(!limiter.isAllowed('user1'), 'User1 third request blocked');
  assert(!limiter.isAllowed('user2'), 'User2 third request blocked');
}

// Test 3: Remaining requests
function testRemainingRequests(): void {
  const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 5 });
  
  assert(limiter.getRemaining('user1') === 5, 'Should have 5 requests initially');
  limiter.isAllowed('user1');
  assert(limiter.getRemaining('user1') === 4, 'Should have 4 requests after one');
  limiter.isAllowed('user1');
  limiter.isAllowed('user1');
  assert(limiter.getRemaining('user1') === 2, 'Should have 2 requests after three');
}

// Test 4: Reset time
function testResetTime(): void {
  const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 3 });
  
  limiter.isAllowed('user1');
  const resetTime = limiter.getResetTime('user1');
  assert(resetTime > 0 && resetTime <= 1000, 'Reset time should be within window');
}

// Test 5: Window reset
async function testWindowReset(): Promise<void> {
  const limiter = new RateLimiter({ windowMs: 100, maxRequests: 2 });
  
  assert(limiter.isAllowed('user1'), 'First request allowed');
  assert(limiter.isAllowed('user1'), 'Second request allowed');
  assert(!limiter.isAllowed('user1'), 'Third request blocked');
  
  await sleep(150); // Wait for window to reset
  
  assert(limiter.isAllowed('user1'), 'First request after reset allowed');
  assert(limiter.getRemaining('user1') === 1, 'Should have 1 request remaining after reset');
}

// Test 6: Clear functionality
function testClear(): void {
  const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 });
  
  limiter.isAllowed('user1');
  assert(!limiter.isAllowed('user1'), 'Request should be blocked');
  
  limiter.clear();
  assert(limiter.isAllowed('user1'), 'Request should be allowed after clear');
}

// Test 7: Edge case - zero remaining
function testZeroRemaining(): void {
  const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 });
  
  limiter.isAllowed('user1');
  assert(limiter.getRemaining('user1') === 0, 'Should have 0 requests remaining');
  assert(!limiter.isAllowed('user1'), 'Request should be blocked when 0 remaining');
}

// Run all tests
(async () => {
  testBasicRateLimiting();
  testMultipleIdentifiers();
  testRemainingRequests();
  testResetTime();
  await testWindowReset();
  testClear();
  testZeroRemaining();

  console.log(`\nTest Results: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed > 0) {
    process.exit(1);
  }
})();
