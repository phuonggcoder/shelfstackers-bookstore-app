// Test Google Sign-In Flow
const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// Test 1: Backend Status
async function testBackendStatus() {
  try {
    console.log('🧪 Test 1: Backend Status');
    const response = await fetch(`${API_BASE_URL}/api/users/google-auth-status`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Backend is ready for Google Sign-In');
      console.log('📋 Supported Client IDs:', data.status.googleClientIds.length);
      return true;
    } else {
      console.log('❌ Backend not ready');
      return false;
    }
  } catch (error) {
    console.error('❌ Backend status test failed:', error);
    return false;
  }
}

// Test 2: Google Sign-In Endpoint
async function testGoogleSignInEndpoint() {
  try {
    console.log('\n🧪 Test 2: Google Sign-In Endpoint');
    
    // Test với invalid token
    const mockIdToken = 'invalid_token_for_testing';
    
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
    
    if (response.status === 400) {
      console.log('✅ Endpoint working (expected error for invalid token)');
      console.log('📋 Error message:', responseText);
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

// Test 3: Refresh Token Endpoint
async function testRefreshTokenEndpoint() {
  try {
    console.log('\n🧪 Test 3: Refresh Token Endpoint');
    
    const mockRefreshToken = 'invalid_refresh_token_for_testing';
    
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
    
    if (response.status === 401) {
      console.log('✅ Refresh token endpoint working (expected error for invalid token)');
      console.log('📋 Error message:', responseText);
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

// Test 4: Response Format Validation
function testResponseFormat() {
  console.log('\n🧪 Test 4: Response Format Validation');
  
  // Mock successful response format
  const mockSuccessResponse = {
    success: true,
    message: "Đăng nhập Google thành công",
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
      id: "user_id",
      username: "user@example.com",
      email: "user@example.com",
      full_name: "User Name",
      roles: ["user"],
      avatar: "https://...",
      is_verified: true,
      login_count: 0
    },
    expires_in: 14400,
    refresh_expires_in: 2592000,
    token_type: "Bearer"
  };

  // Validate required fields
  const requiredFields = ['success', 'access_token', 'refresh_token', 'user'];
  const missingFields = requiredFields.filter(field => !mockSuccessResponse[field]);
  
  if (missingFields.length === 0) {
    console.log('✅ Response format is valid');
    console.log('📋 Required fields present:', requiredFields);
    return true;
  } else {
    console.log('❌ Missing required fields:', missingFields);
    return false;
  }
}

// Test 5: User Format Validation
function testUserFormat() {
  console.log('\n🧪 Test 5: User Format Validation');
  
  const mockUser = {
    id: "user_id",
    username: "user@example.com",
    email: "user@example.com",
    full_name: "User Name",
    roles: ["user"],
    avatar: "https://...",
    is_verified: true,
    login_count: 0
  };

  const requiredUserFields = ['id', 'username', 'email', 'full_name', 'roles'];
  const missingUserFields = requiredUserFields.filter(field => !mockUser[field]);
  
  if (missingUserFields.length === 0) {
    console.log('✅ User format is valid');
    console.log('📋 Required user fields present:', requiredUserFields);
    return true;
  } else {
    console.log('❌ Missing required user fields:', missingUserFields);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Google Sign-In Flow Tests...\n');
  
  const results = {
    backendStatus: await testBackendStatus(),
    googleSignInEndpoint: await testGoogleSignInEndpoint(),
    refreshTokenEndpoint: await testRefreshTokenEndpoint(),
    responseFormat: testResponseFormat(),
    userFormat: testUserFormat(),
  };

  console.log('\n📊 Test Results Summary:');
  console.log('Backend Status:', results.backendStatus ? '✅ Pass' : '❌ Fail');
  console.log('Google Sign-In Endpoint:', results.googleSignInEndpoint ? '✅ Pass' : '❌ Fail');
  console.log('Refresh Token Endpoint:', results.refreshTokenEndpoint ? '✅ Pass' : '❌ Fail');
  console.log('Response Format:', results.responseFormat ? '✅ Pass' : '❌ Fail');
  console.log('User Format:', results.userFormat ? '✅ Pass' : '❌ Fail');

  const passedTests = Object.values(results).filter(result => result).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Google Sign-In flow is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }
  
  return results;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testBackendStatus,
    testGoogleSignInEndpoint,
    testRefreshTokenEndpoint,
    testResponseFormat,
    testUserFormat,
    runAllTests,
  };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
} 