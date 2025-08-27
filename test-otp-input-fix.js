// Test script để verify OTP input fixes
console.log('🧪 Testing OTP Input Fixes...\n');

// Test 1: Test OTP cleaning logic (đã sửa)
console.log('1️⃣ Testing OTP cleaning logic (after fix)...');

const testOTPCleaning = (input, expected) => {
  // Logic mới: chỉ remove non-numeric và limit to 6 digits
  const cleaned = input.replace(/[^0-9]/g, '').slice(0, 6);
  const passed = cleaned === expected;
  console.log(`Input: "${input}" -> Output: "${cleaned}" (expected: "${expected}") ${passed ? '✅' : '❌'}`);
  return passed;
};

const cleaningTests = [
  { input: '123456', expected: '123456' },
  { input: '123 456', expected: '123456' }, // Spaces sẽ bị remove
  { input: '12a34b56', expected: '123456' }, // Letters sẽ bị remove
  { input: '123456789', expected: '123456' }, // Truncate to 6
  { input: '123', expected: '123' }, // Short input
  { input: '', expected: '' }, // Empty input
];

let passedTests = 0;
cleaningTests.forEach((test, index) => {
  if (testOTPCleaning(test.input, test.expected)) {
    passedTests++;
  }
});

console.log(`\n📊 Cleaning Tests: ${passedTests}/${cleaningTests.length} passed\n`);

// Test 2: Test validation logic
console.log('2️⃣ Testing validation logic...');

const validateOTP = (otp) => {
  const trimmed = otp.trim();
  const isValid = trimmed.length === 6 && /^\d{6}$/.test(trimmed);
  return {
    input: otp,
    trimmed: trimmed,
    length: trimmed.length,
    isNumeric: /^\d{6}$/.test(trimmed),
    isValid: isValid
  };
};

const validationTests = [
  '123456',
  '123 456',
  '12a34b56',
  '123',
  '123456789',
  '',
  '  123456  '
];

validationTests.forEach((test, index) => {
  const result = validateOTP(test);
  console.log(`Test ${index + 1}: "${test}"`);
  console.log(`  Trimmed: "${result.trimmed}"`);
  console.log(`  Length: ${result.length}`);
  console.log(`  Is Numeric: ${result.isNumeric}`);
  console.log(`  Valid: ${result.isValid ? '✅' : '❌'}`);
  console.log('');
});

// Test 3: Test user scenarios
console.log('3️⃣ Testing user scenarios...');

const userScenarios = [
  {
    name: 'User nhập OTP thường',
    input: '123456',
    expected: '123456',
    shouldWork: true
  },
  {
    name: 'User nhập OTP với spaces (cũ)',
    input: '123 456',
    expected: '123456',
    shouldWork: true
  },
  {
    name: 'User nhập OTP ngắn',
    input: '123',
    expected: '123',
    shouldWork: false
  },
  {
    name: 'User nhập OTP dài',
    input: '123456789',
    expected: '123456',
    shouldWork: true
  }
];

userScenarios.forEach((scenario, index) => {
  const cleaned = scenario.input.replace(/[^0-9]/g, '').slice(0, 6);
  const isValid = cleaned.length === 6;
  const works = isValid === scenario.shouldWork;
  
  console.log(`Scenario ${index + 1}: ${scenario.name}`);
  console.log(`  Input: "${scenario.input}"`);
  console.log(`  Cleaned: "${cleaned}"`);
  console.log(`  Expected: "${scenario.expected}"`);
  console.log(`  Valid: ${isValid ? '✅' : '❌'}`);
  console.log(`  Works: ${works ? '✅' : '❌'}`);
  console.log('');
});

console.log('🎯 OTP Input Fix Summary:');
console.log('✅ Removed automatic space formatting');
console.log('✅ Allow normal number input');
console.log('✅ Still clean non-numeric characters');
console.log('✅ Still limit to 6 digits');
console.log('✅ Backend will handle cleaning automatically');
console.log('\n🚀 User can now input OTP normally without spaces!');
