const axios = require('axios');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// Test data
const testEmail = 'test@example.com';
const testPassword = 'password123';
const testUsername = 'testuser';

async function testEmailLogin() {
  console.log('🧪 Testing Email Login Implementation...\n');

  try {
    // Test 1: Register with email
    console.log('1️⃣ Testing registration with email...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      username: testUsername,
      email: testEmail,
      password: testPassword,
      full_name: 'Test User'
    });
    
    console.log('✅ Registration successful:', {
      user: registerResponse.data.user?.email,
      token: registerResponse.data.token ? 'Present' : 'Missing'
    });

    // Test 2: Login with email
    console.log('\n2️⃣ Testing login with email...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login successful:', {
      user: loginResponse.data.user?.email,
      token: loginResponse.data.token ? 'Present' : 'Missing'
    });

    // Test 3: Login with invalid email format
    console.log('\n3️⃣ Testing login with invalid email format...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'invalid-email',
        password: testPassword
      });
      console.log('❌ Should have failed with invalid email format');
    } catch (error) {
      console.log('✅ Invalid email format rejected:', error.response?.data?.message || error.message);
    }

    // Test 4: Login with non-existent email
    console.log('\n4️⃣ Testing login with non-existent email...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'nonexistent@example.com',
        password: testPassword
      });
      console.log('❌ Should have failed with non-existent email');
    } catch (error) {
      console.log('✅ Non-existent email rejected:', error.response?.data?.message || error.message);
    }

    // Test 5: Login with wrong password
    console.log('\n5️⃣ Testing login with wrong password...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testEmail,
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed with wrong password');
    } catch (error) {
      console.log('✅ Wrong password rejected:', error.response?.data?.message || error.message);
    }

    // Test 6: Register with existing email
    console.log('\n6️⃣ Testing registration with existing email...');
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        username: 'anotheruser',
        email: testEmail,
        password: testPassword,
        full_name: 'Another User'
      });
      console.log('❌ Should have failed with existing email');
    } catch (error) {
      console.log('✅ Existing email rejected:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 All email login tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testEmailLogin(); 