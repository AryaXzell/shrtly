import { validateAndNormalizeUrl, validateCustomAlias } from './urlUtils';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
}

const tests: { name: string; fn: () => void }[] = [];

function test(name: string, fn: () => void) {
  tests.push({ name, fn });
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected: ${expected}, but got: ${actual}`);
  }
}

// -------------------------------------------------------------
// URL VALIDATION & SSRF TESTS
// -------------------------------------------------------------
test('validateAndNormalizeUrl - valid public URLs', () => {
  const r1 = validateAndNormalizeUrl('https://google.com');
  assert(r1.isValid, 'google.com should be valid');
  assertEquals(r1.normalizedUrl, 'https://google.com/');

  const r2 = validateAndNormalizeUrl('github.com/aryaxzell');
  assert(r2.isValid, 'short format should be auto-prepended with https');
  assertEquals(r2.normalizedUrl, 'https://github.com/aryaxzell');
});

test('validateAndNormalizeUrl - SSRF blocking (Localhost, Private IPs)', () => {
  const badUrls = [
    'http://localhost',
    'http://127.0.0.1',
    'http://192.168.1.1',
    'http://10.0.0.1',
    'http://172.16.0.1',
    'https://[::1]',
    'http://0.0.0.0'
  ];

  for (const url of badUrls) {
    const r = validateAndNormalizeUrl(url);
    assert(!r.isValid, `SSRF source should be blocked: ${url}`);
  }
});

test('validateAndNormalizeUrl - suspicious domains detection', () => {
  const r = validateAndNormalizeUrl('http://grabify.link/path');
  assert(r.isValid, 'Should remain valid but flagged as suspicious');
  assert(!!r.isSuspicious, 'Grabify should be flagged as suspicious');
  assertEquals(r.suspiciousReason, 'Domain is associated with IP loggers or deceptive tracking.');
});

test('validateCustomAlias - alias restrictions', () => {
  const r1 = validateCustomAlias('my-link');
  assert(r1.isValid, 'Simple slug should be valid');

  const r2 = validateCustomAlias('api');
  assert(!r2.isValid, 'Reserved words must be invalid');
  assertEquals(r2.error, 'The alias "api" is reserved by system routes');

  const r3 = validateCustomAlias('too_long_alias_with_more_than_thirty_characters_limit');
  assert(!r3.isValid, 'Long alias should be rejected');
});

// -------------------------------------------------------------
// TEST RUNNER EXECUTION
// -------------------------------------------------------------
async function runAll() {
  console.log('=== SHRTLY BACKEND TEST RUNNER ===');
  console.log(`Running ${tests.length} tests...\n`);
  
  let passed = 0;
  const results: TestResult[] = [];

  for (const t of tests) {
    try {
      t.fn();
      results.push({ name: t.name, success: true });
      passed++;
      console.log(`✅ [PASS] ${t.name}`);
    } catch (err: any) {
      results.push({ name: t.name, success: false, error: err?.message || String(err) });
      console.error(`❌ [FAIL] ${t.name}`);
      console.error(`   Error: ${err?.message || err}`);
    }
  }

  console.log(`\n=== TEST RESULT SUMMARY ===`);
  console.log(`Passed: ${passed} / ${tests.length}`);
  
  if (passed === tests.length) {
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Automated safety net is active.');
    process.exit(0);
  } else {
    console.error('\n⚠️ SOME TESTS FAILED. Please review the errors above.');
    process.exit(1);
  }
}

runAll();
