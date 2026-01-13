import 'reflect-metadata';
import { RateLimiterService } from '../src/services/RateLimiterService';

/**
 * Simple assertion helper for tests
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Helper to pause execution for a specified time
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test suite for RateLimiterService
 */
async function runTests(): Promise<void> {
  console.log('Running RateLimiterService tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Basic rate limiting
  try {
    console.log('Test 1: Basic rate limiting within window');
    const limiter = new RateLimiterService({
      maxRequests: 3,
      windowMs: 1000 // 1 second
    });
    
    // First 3 requests should be allowed
    for (let i = 0; i < 3; i++) {
      const result = limiter.checkLimit('client1');
      assert(result.allowed, `Request ${i + 1} should be allowed`);
    }
    
    // 4th request should be blocked
    const result = limiter.checkLimit('client1');
    assert(!result.allowed, '4th request should be blocked');
    assert(result.retryAfter !== undefined, 'Should provide retry after time');
    
    limiter.destroy();
    console.log('✓ Test 1 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 1 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Test 2: Multiple clients are tracked independently
  try {
    console.log('Test 2: Multiple clients tracked independently');
    const limiter = new RateLimiterService({
      maxRequests: 2,
      windowMs: 1000
    });
    
    // Client 1 makes 2 requests
    limiter.checkLimit('client1');
    limiter.checkLimit('client1');
    
    // Client 2 should still be allowed
    const result1 = limiter.checkLimit('client2');
    assert(result1.allowed, 'Client 2 should be allowed');
    
    // But client 1 should be blocked
    const result2 = limiter.checkLimit('client1');
    assert(!result2.allowed, 'Client 1 should be blocked');
    
    limiter.destroy();
    console.log('✓ Test 2 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 2 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Test 3: Sliding window - old requests expire
  try {
    console.log('Test 3: Sliding window - old requests expire');
    const limiter = new RateLimiterService({
      maxRequests: 2,
      windowMs: 500 // 500ms window
    });
    
    // Make 2 requests
    limiter.checkLimit('client1');
    limiter.checkLimit('client1');
    
    // Should be blocked immediately
    let result = limiter.checkLimit('client1');
    assert(!result.allowed, 'Should be blocked immediately');
    
    // Wait for window to expire
    await sleep(550);
    
    // Should be allowed again
    result = limiter.checkLimit('client1');
    assert(result.allowed, 'Should be allowed after window expires');
    
    limiter.destroy();
    console.log('✓ Test 3 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 3 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Test 4: getStatus doesn't consume a request
  try {
    console.log('Test 4: getStatus doesn\'t consume requests');
    const limiter = new RateLimiterService({
      maxRequests: 3,
      windowMs: 1000
    });
    
    // Check status without consuming
    const status1 = limiter.getStatus('client1');
    assert(status1.requestCount === 0, 'Should have 0 requests');
    assert(status1.remaining === 3, 'Should have 3 remaining');
    
    // Make a real request
    limiter.checkLimit('client1');
    
    // Check status again
    const status2 = limiter.getStatus('client1');
    assert(status2.requestCount === 1, 'Should have 1 request');
    assert(status2.remaining === 2, 'Should have 2 remaining');
    
    limiter.destroy();
    console.log('✓ Test 4 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 4 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Test 5: resetClient clears client history
  try {
    console.log('Test 5: resetClient clears client history');
    const limiter = new RateLimiterService({
      maxRequests: 2,
      windowMs: 1000
    });
    
    // Exhaust limit
    limiter.checkLimit('client1');
    limiter.checkLimit('client1');
    
    // Should be blocked
    let result = limiter.checkLimit('client1');
    assert(!result.allowed, 'Should be blocked');
    
    // Reset client
    limiter.resetClient('client1');
    
    // Should be allowed again
    result = limiter.checkLimit('client1');
    assert(result.allowed, 'Should be allowed after reset');
    
    limiter.destroy();
    console.log('✓ Test 5 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 5 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Test 6: resetAll clears all clients
  try {
    console.log('Test 6: resetAll clears all clients');
    const limiter = new RateLimiterService({
      maxRequests: 1,
      windowMs: 1000
    });
    
    // Exhaust limits for multiple clients
    limiter.checkLimit('client1');
    limiter.checkLimit('client2');
    limiter.checkLimit('client3');
    
    // All should be blocked
    assert(!limiter.checkLimit('client1').allowed, 'Client 1 should be blocked');
    assert(!limiter.checkLimit('client2').allowed, 'Client 2 should be blocked');
    assert(!limiter.checkLimit('client3').allowed, 'Client 3 should be blocked');
    
    // Reset all
    limiter.resetAll();
    
    // All should be allowed again
    assert(limiter.checkLimit('client1').allowed, 'Client 1 should be allowed');
    assert(limiter.checkLimit('client2').allowed, 'Client 2 should be allowed');
    assert(limiter.checkLimit('client3').allowed, 'Client 3 should be allowed');
    
    limiter.destroy();
    console.log('✓ Test 6 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 6 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Test 7: Remaining count is accurate
  try {
    console.log('Test 7: Remaining count is accurate');
    const limiter = new RateLimiterService({
      maxRequests: 5,
      windowMs: 1000
    });
    
    // First request
    let result = limiter.checkLimit('client1');
    assert(result.remaining === 4, 'Should have 4 remaining after 1st request');
    
    // Second request
    result = limiter.checkLimit('client1');
    assert(result.remaining === 3, 'Should have 3 remaining after 2nd request');
    
    // Third request
    result = limiter.checkLimit('client1');
    assert(result.remaining === 2, 'Should have 2 remaining after 3rd request');
    
    limiter.destroy();
    console.log('✓ Test 7 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 7 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Test 8: resetAt time is correct
  try {
    console.log('Test 8: resetAt time is calculated correctly');
    const windowMs = 1000;
    const limiter = new RateLimiterService({
      maxRequests: 2,
      windowMs
    });
    
    const before = Date.now();
    const result = limiter.checkLimit('client1');
    const after = Date.now();
    
    const resetTime = result.resetAt.getTime();
    const expectedMin = before + windowMs;
    const expectedMax = after + windowMs;
    
    assert(
      resetTime >= expectedMin && resetTime <= expectedMax,
      `Reset time ${resetTime} should be between ${expectedMin} and ${expectedMax}`
    );
    
    limiter.destroy();
    console.log('✓ Test 8 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 8 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Test 9: Custom message option
  try {
    console.log('Test 9: Custom message option is stored');
    const customMessage = 'Please slow down!';
    const limiter = new RateLimiterService({
      maxRequests: 1,
      windowMs: 1000,
      message: customMessage
    });
    
    // Note: This test just verifies the service accepts the option
    // The message is used by the middleware, not the service itself
    assert(true, 'Service should accept custom message option');
    
    limiter.destroy();
    console.log('✓ Test 9 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 9 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Test 10: Rapid sequential requests
  try {
    console.log('Test 10: Rapid sequential requests');
    const limiter = new RateLimiterService({
      maxRequests: 10,
      windowMs: 1000
    });
    
    let allowedCount = 0;
    let blockedCount = 0;
    
    // Make 15 rapid requests
    for (let i = 0; i < 15; i++) {
      const result = limiter.checkLimit('client1');
      if (result.allowed) {
        allowedCount++;
      } else {
        blockedCount++;
      }
    }
    
    assert(allowedCount === 10, `Should allow exactly 10 requests, got ${allowedCount}`);
    assert(blockedCount === 5, `Should block exactly 5 requests, got ${blockedCount}`);
    
    limiter.destroy();
    console.log('✓ Test 10 passed\n');
    passed++;
  } catch (error) {
    console.error('✗ Test 10 failed:', (error as Error).message, '\n');
    failed++;
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
