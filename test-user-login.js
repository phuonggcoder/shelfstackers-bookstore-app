const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function testUserLogin() {
  try {
    console.log('🧪 Testing user login...');
    
    // Test with different passwords
    const testCases = [
      { email: 'y2mtlath@gmail.com', password: '123123' },
      { email: 'y2mtlath@gmail.com', password: 'password123' },
      { email: 'y2mtlath@gmail.com', password: 'test123' },
      { email: 'y2mtlath@gmail.com', password: '123456' },
      { email: 'y2mtlath@gmail.com', password: 'password' },
      { email: 'y2mtlath@gmail.com', password: 'admin' },
      { email: 'y2mtlath@gmail.com', password: 'user' },
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`\n🔑 Testing: ${testCase.email} / ${testCase.password}`);
        
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testCase.email,
          password: testCase.password
        });
        
        console.log(`✅ SUCCESS with password: ${testCase.password}`);
        console.log('📝 Response:', loginResponse.data);
        return;
        
      } catch (error) {
        console.log(`❌ Failed with password: ${testCase.password}`);
        console.log('📝 Error:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n❌ All passwords failed!');
    console.log('💡 User may need to reset password or re-register');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test password reset
async function testPasswordReset() {
  try {
    console.log('\n🧪 Testing password reset...');
    
    const resetResponse = await axios.post(`${API_BASE_URL}/api/users/forgot-password`, {
      email: 'y2mtlath@gmail.com'
    });
    
    console.log('✅ Password reset response:', resetResponse.data);
    
  } catch (error) {
    console.error('❌ Password reset error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await testUserLogin();
  await testPasswordReset();
}

runTests();

