#!/usr/bin/env node

/**
 * Test script for Review User Endpoint
 * Usage: node test-review-endpoint.js
 */

const https = require('https');

const API_BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';
const ENDPOINT = '/api/v1/review/user';

// Test cases
const testCases = [
  {
    name: 'Test without token',
    token: null,
    expectedStatus: 401
  },
  {
    name: 'Test with invalid token',
    token: 'invalid_token',
    expectedStatus: 401
  },
  {
    name: 'Test with valid token (if available)',
    token: process.env.TEST_TOKEN || 'your_valid_token_here',
    expectedStatus: 200
  },
  {
    name: 'Test with pagination',
    token: process.env.TEST_TOKEN || 'your_valid_token_here',
    expectedStatus: 200,
    query: '?page=1&limit=5'
  }
];

function makeRequest(token, query = '') {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${ENDPOINT}${query}`;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`\n🔍 Testing: ${url}`);
    console.log(`📋 Headers:`, options.headers);

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Review User Endpoint');
  console.log('================================');
  console.log(`🌐 Base URL: ${API_BASE_URL}`);
  console.log(`📡 Endpoint: ${ENDPOINT}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('');

  for (const testCase of testCases) {
    try {
      console.log(`\n📝 ${testCase.name}`);
      console.log('─'.repeat(50));
      
      const response = await makeRequest(testCase.token, testCase.query || '');
      
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Expected: ${testCase.expectedStatus}`);
      
      if (response.status === testCase.expectedStatus) {
        console.log('✅ PASS');
      } else {
        console.log('❌ FAIL');
      }
      
      if (response.body) {
        console.log('📄 Response:');
        console.log(JSON.stringify(response.body, null, 2));
      }
      
      // Special handling for 500 error
      if (response.status === 500) {
        console.log('⚠️  Backend endpoint chưa được implement!');
        console.log('📋 Cần implement endpoint theo BACKEND_REVIEW_ENDPOINT_SPEC.md');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  console.log('✅ Frontend đã được fix để handle lỗi 500 gracefully');
  console.log('⏳ Backend cần implement endpoint /api/v1/review/user');
  console.log('📖 Xem BACKEND_REVIEW_ENDPOINT_SPEC.md để biết chi tiết');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { makeRequest, runTests }; 