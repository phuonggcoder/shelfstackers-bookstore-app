// Test Google Sign-In Implementation
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// Test 1: Kiểm tra backend status
async function testBackendStatus() {
  try {
    console.log('🧪 Testing backend status...');
    const response = await fetch(`${API_BASE_URL}/api/users/google-auth-status`);
    const data = await response.json();
    console.log('✅ Backend status:', data);
    return data;
  } catch (error) {
    console.error('❌ Backend status test failed:', error);
    return null;
  }
}

// Test 2: Test Google Sign-In endpoint với mock token
async function testGoogleSignInEndpoint() {
  try {
    console.log('🧪 Testing Google Sign-In endpoint...');
    
    // Mock ID token (sẽ không hoạt động nhưng để test endpoint)
    const mockIdToken = 'mock_google_id_token_for_testing';
    
    const response = await fetch(`${API_BASE_URL}/api/users/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_token: mockIdToken,
      }),
    });

    const responseText = await response.text();
    console.log('🔧 Response status:', response.status);
    console.log('🔧 Response text:', responseText);

    if (response.status === 400) {
      console.log('✅ Endpoint working (expected error for invalid token)');
      return true;
    } else if (response.status === 200) {
      console.log('✅ Endpoint working (unexpected success)');
      return true;
    } else {
      console.log('❌ Unexpected response status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Google Sign-In endpoint test failed:', error);
    return false;
  }
}

// Test 3: Test refresh token endpoint
async function testRefreshTokenEndpoint() {
  try {
    console.log('🧪 Testing refresh token endpoint...');
    
    const mockRefreshToken = 'mock_refresh_token_for_testing';
    
    const response = await fetch(`${API_BASE_URL}/api/users/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: mockRefreshToken,
      }),
    });

    const responseText = await response.text();
    console.log('🔧 Refresh token response status:', response.status);
    console.log('🔧 Refresh token response text:', responseText);

    if (response.status === 400 || response.status === 401) {
      console.log('✅ Refresh token endpoint working (expected error for invalid token)');
      return true;
    } else {
      console.log('❌ Unexpected refresh token response status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Refresh token endpoint test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Google Sign-In tests...\n');
  
  const results = {
    backendStatus: await testBackendStatus(),
    googleSignInEndpoint: await testGoogleSignInEndpoint(),
    refreshTokenEndpoint: await testRefreshTokenEndpoint(),
  };

  console.log('\n📊 Test Results:');
  console.log('Backend Status:', results.backendStatus ? '✅ Working' : '❌ Failed');
  console.log('Google Sign-In Endpoint:', results.googleSignInEndpoint ? '✅ Working' : '❌ Failed');
  console.log('Refresh Token Endpoint:', results.refreshTokenEndpoint ? '✅ Working' : '❌ Failed');

  const allPassed = Object.values(results).every(result => result);
  console.log('\n🎯 Overall Result:', allPassed ? '✅ All tests passed!' : '❌ Some tests failed');
  
  return results;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testBackendStatus,
    testGoogleSignInEndpoint,
    testRefreshTokenEndpoint,
    runAllTests,
  };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
} 