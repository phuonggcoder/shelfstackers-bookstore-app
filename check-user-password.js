const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function checkUserPassword() {
  try {
    console.log('🔍 Checking user password...');
    
    // Test different passwords
    const passwords = ['123123', 'password123', 'test123', '123456'];
    
    for (const password of passwords) {
      try {
        console.log(`\n🔑 Testing password: ${password}`);
        
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'y2mtlath@gmail.com',
          password: password
        });
        
        console.log(`✅ SUCCESS with password: ${password}`);
        console.log('📝 Response:', loginResponse.data);
        return;
        
      } catch (error) {
        console.log(`❌ Failed with password: ${password}`);
        console.log('📝 Error:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n❌ All passwords failed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test registration with new user
async function testNewRegistration() {
  try {
    console.log('\n🧪 Testing new registration...');
    
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    console.log('📧 Test email:', testEmail);
    console.log('🔑 Test password:', testPassword);
    
    // 1. Register
    console.log('\n1️⃣ Registering...');
    const registerResponse = await axios.post(`${API_BASE_URL}/api/users/register`, {
      email: testEmail,
      password: testPassword,
      username: `test${Date.now()}`.slice(-15), // Giới hạn 15 ký tự
      full_name: 'Test User'
    });
    
    console.log('✅ Register response:', registerResponse.data);
    
    // 2. Try login immediately (should fail)
    console.log('\n2️⃣ Trying login immediately (should fail)...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log('❌ Login should have failed but succeeded:', loginResponse.data);
    } catch (error) {
      console.log('✅ Login failed as expected:', error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Registration error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await checkUserPassword();
  await testNewRegistration();
}

runTests();
