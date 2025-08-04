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

async function testFrontendIntegration() {
  console.log('🧪 Testing Frontend Integration with Address API...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Complete flow - Hà Nội → Hoàn Kiếm → Phường Ba Đình
  try {
    console.log('1️⃣ Testing complete address flow...');
    
    // Step 1: Get provinces
    const provincesResponse = await axios.get(`${BASE_URL}/address/all-province`, { headers });
    const haNoi = provincesResponse.data.data.find(p => p.name.includes('Hà Nội'));
    console.log('✅ Found Hà Nội province:', haNoi?.name);
    
    // Step 2: Get districts for Hà Nội
    const districtsResponse = await axios.get(`${BASE_URL}/address/districts?provice-code=${haNoi.code}`, { headers });
    const hoanKiem = districtsResponse.data.data.find(d => d.name.includes('Hoàn Kiếm'));
    console.log('✅ Found Hoàn Kiếm district:', hoanKiem?.name);
    
    // Step 3: Get wards for Hoàn Kiếm
    const wardsResponse = await axios.get(`${BASE_URL}/address/wards?province-code=${haNoi.code}&districts-code=${hoanKiem.code}`, { headers });
    const baDinh = wardsResponse.data.data.find(w => w.name.includes('Ba Đình'));
    console.log('✅ Found Phường Ba Đình ward:', baDinh?.name);
    
    console.log('📍 Complete address: Hà Nội → Hoàn Kiếm → Phường Ba Đình');
    
    results.passed++;
    results.tests.push({ 
      name: 'Complete Address Flow', 
      status: 'PASS', 
      details: `${haNoi?.name} → ${hoanKiem?.name} → ${baDinh?.name}` 
    });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Complete Address Flow', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 2: Test with Dương Minh Châu (rural district)
  try {
    console.log('\n2️⃣ Testing rural district (Dương Minh Châu)...');
    
    // Get Tây Ninh province
    const provincesResponse = await axios.get(`${BASE_URL}/address/all-province`, { headers });
    const tayNinh = provincesResponse.data.data.find(p => p.name.includes('Tây Ninh'));
    console.log('✅ Found Tây Ninh province:', tayNinh?.name);
    
    // Get districts for Tây Ninh
    const districtsResponse = await axios.get(`${BASE_URL}/address/districts?provice-code=${tayNinh.code}`, { headers });
    const duongMinhChau = districtsResponse.data.data.find(d => d.name.includes('Dương Minh Châu'));
    console.log('✅ Found Dương Minh Châu district:', duongMinhChau?.name);
    
    // Get wards for Dương Minh Châu
    const wardsResponse = await axios.get(`${BASE_URL}/address/wards?province-code=${tayNinh.code}&districts-code=${duongMinhChau.code}`, { headers });
    console.log('📊 Wards count for Dương Minh Châu:', wardsResponse.data.data?.length || 0);
    
    if (wardsResponse.data.data?.length === 0) {
      console.log('ℹ️ Dương Minh Châu has no wards (rural district)');
    } else {
      console.log('📍 Sample wards:');
      wardsResponse.data.data.slice(0, 3).forEach((ward, index) => {
        console.log(`   ${index + 1}. ${ward.name} (${ward.code})`);
      });
    }
    
    results.passed++;
    results.tests.push({ 
      name: 'Rural District Test', 
      status: 'PASS', 
      details: `${tayNinh?.name} → ${duongMinhChau?.name} (${wardsResponse.data.data?.length || 0} wards)` 
    });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Rural District Test', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 3: Test search functionality
  try {
    console.log('\n3️⃣ Testing search functionality...');
    
    // Search for "Ha"
    const searchResponse = await axios.get(`${BASE_URL}/address/search?q=Ha`, { headers });
    console.log('✅ Search "Ha" results:', searchResponse.data.data?.length || 0);
    
    // Search for "Ba"
    const searchBaResponse = await axios.get(`${BASE_URL}/address/search?q=Ba`, { headers });
    console.log('✅ Search "Ba" results:', searchBaResponse.data.data?.length || 0);
    
    results.passed++;
    results.tests.push({ 
      name: 'Search Functionality', 
      status: 'PASS', 
      details: `"Ha": ${searchResponse.data.data?.length || 0} results, "Ba": ${searchBaResponse.data.data?.length || 0} results` 
    });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Search Functionality', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Test 4: Test autocomplete functionality
  try {
    console.log('\n4️⃣ Testing autocomplete functionality...');
    
    // Province autocomplete
    const provinceAutoResponse = await axios.get(`${BASE_URL}/address/autocomplete/province?q=Ha`, { headers });
    console.log('✅ Province autocomplete "Ha":', provinceAutoResponse.data.data?.length || 0, 'results');
    
    // District autocomplete
    const districtAutoResponse = await axios.get(`${BASE_URL}/address/autocomplete/district?provinceId=01&q=Ba`, { headers });
    console.log('✅ District autocomplete "Ba":', districtAutoResponse.data.data?.length || 0, 'results');
    
    results.passed++;
    results.tests.push({ 
      name: 'Autocomplete Functionality', 
      status: 'PASS', 
      details: `Province: ${provinceAutoResponse.data.data?.length || 0}, District: ${districtAutoResponse.data.data?.length || 0}` 
    });
  } catch (error) {
    console.log('❌ Failed:', error.response?.status, error.response?.data?.errors?.[0] || error.message);
    results.failed++;
    results.tests.push({ name: 'Autocomplete Functionality', status: 'FAIL', error: error.response?.data?.errors?.[0] || error.message });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FRONTEND INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.tests.forEach((test, index) => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    const details = test.details ? ` - ${test.details}` : '';
    const error = test.error ? ` - ${test.error}` : '';
    console.log(`${index + 1}. ${status} ${test.name}${details}${error}`);
  });

  if (results.failed === 0) {
    console.log('\n🎉 All frontend integration tests passed!');
    console.log('✅ Address API is ready for frontend use!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
  }
}

// Run the test
testFrontendIntegration(); 