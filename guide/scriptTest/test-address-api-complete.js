const axios = require('axios');

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

// Headers để tránh Cloudflare
const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
  'Referer': 'https://server-shelf-stacker-w1ds.onrender.com/',
  'Origin': 'https://server-shelf-stacker-w1ds.onrender.com',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"'
};

async function testAddressAPI() {
  console.log('🧪 Testing Address API Complete...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: All Provinces
  try {
    console.log('1️⃣ Testing /address/all-province...');
    const response = await axios.get(`${BASE_URL}/address/all-province`, { headers });
    console.log('✅ Status:', response.status);
    console.log('📊 Provinces count:', response.data.data?.length || 0);
    results.passed++;
    results.tests.push({ name: 'All Provinces', status: 'PASS', count: response.data.data?.length || 0 });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'All Provinces', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 2: Provinces with search
  try {
    console.log('\n2️⃣ Testing /address/all-province?q=Ha...');
    const response = await axios.get(`${BASE_URL}/address/all-province?q=Ha`, { headers });
    console.log('✅ Status:', response.status);
    console.log('📊 Search results count:', response.data.data?.length || 0);
    results.passed++;
    results.tests.push({ name: 'Provinces Search', status: 'PASS', count: response.data.data?.length || 0 });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Provinces Search', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 3: Districts for Hà Nội
  try {
    console.log('\n3️⃣ Testing /address/districts?provice-code=01...');
    const response = await axios.get(`${BASE_URL}/address/districts?provice-code=01`, { headers });
    console.log('✅ Status:', response.status);
    console.log('📊 Districts count:', response.data.data?.length || 0);
    results.passed++;
    results.tests.push({ name: 'Districts Hà Nội', status: 'PASS', count: response.data.data?.length || 0 });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Districts Hà Nội', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 4: Wards for Hoàn Kiếm
  try {
    console.log('\n4️⃣ Testing /address/wards?districts-code=Hoàn Kiếm...');
    const response = await axios.get(`${BASE_URL}/address/wards?districts-code=Hoàn Kiếm`, { headers });
    console.log('✅ Status:', response.status);
    console.log('📊 Wards count:', response.data.data?.length || 0);
    if (response.data.data && response.data.data.length > 0) {
      console.log('📍 Sample wards:');
      response.data.data.slice(0, 3).forEach((ward, index) => {
        console.log(`   ${index + 1}. ${ward.name} (${ward.code})`);
      });
    }
    results.passed++;
    results.tests.push({ name: 'Wards Hoàn Kiếm', status: 'PASS', count: response.data.data?.length || 0 });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Wards Hoàn Kiếm', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 5: Search API
  try {
    console.log('\n5️⃣ Testing /address/search?q=Ha...');
    const response = await axios.get(`${BASE_URL}/address/search?q=Ha`, { headers });
    console.log('✅ Status:', response.status);
    console.log('📊 Search results count:', response.data.data?.length || 0);
    results.passed++;
    results.tests.push({ name: 'Search API', status: 'PASS', count: response.data.data?.length || 0 });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Search API', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 6: Province Autocomplete
  try {
    console.log('\n6️⃣ Testing /address/autocomplete/province?q=Ha...');
    const response = await axios.get(`${BASE_URL}/address/autocomplete/province?q=Ha`, { headers });
    console.log('✅ Status:', response.status);
    console.log('📊 Autocomplete results count:', response.data.data?.length || 0);
    results.passed++;
    results.tests.push({ name: 'Province Autocomplete', status: 'PASS', count: response.data.data?.length || 0 });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Province Autocomplete', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 7: District Autocomplete
  try {
    console.log('\n7️⃣ Testing /address/autocomplete/district?provinceId=01&q=Ba...');
    const response = await axios.get(`${BASE_URL}/address/autocomplete/district?provinceId=01&q=Ba`, { headers });
    console.log('✅ Status:', response.status);
    console.log('📊 District autocomplete results count:', response.data.data?.length || 0);
    results.passed++;
    results.tests.push({ name: 'District Autocomplete', status: 'PASS', count: response.data.data?.length || 0 });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'District Autocomplete', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 8: Ward Autocomplete
  try {
    console.log('\n8️⃣ Testing /address/autocomplete/ward?districtId=Hoàn Kiếm&q=Ba...');
    const response = await axios.get(`${BASE_URL}/address/autocomplete/ward?districtId=Hoàn Kiếm&q=Ba`, { headers });
    console.log('✅ Status:', response.status);
    console.log('📊 Ward autocomplete results count:', response.data.data?.length || 0);
    results.passed++;
    results.tests.push({ name: 'Ward Autocomplete', status: 'PASS', count: response.data.data?.length || 0 });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Ward Autocomplete', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.tests.forEach((test, index) => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    const count = test.count ? ` (${test.count} items)` : '';
    const error = test.error ? ` - ${test.error}` : '';
    console.log(`${index + 1}. ${status} ${test.name}${count}${error}`);
  });

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Address API is working perfectly!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
  }
}

// Run the test
testAddressAPI(); 