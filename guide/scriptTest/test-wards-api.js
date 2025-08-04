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

async function testWardsAPI() {
  console.log('🧪 Testing Wards API...\n');

  try {
    // Test 1: Get provinces
    console.log('1️⃣ Testing Provinces API...');
    const provincesResponse = await axios.get(`${BASE_URL}/address/all-province`, { headers });
    console.log('✅ Provinces API Status:', provincesResponse.status);
    console.log('📊 Provinces count:', provincesResponse.data.data?.length || 0);
    
    if (provincesResponse.data.data && provincesResponse.data.data.length > 0) {
      const firstProvince = provincesResponse.data.data[0];
      console.log('📍 First province:', firstProvince.name, `(${firstProvince.code})`);
      
      // Test 2: Get districts for first province
      console.log('\n2️⃣ Testing Districts API...');
      const districtsResponse = await axios.get(`${BASE_URL}/address/districts`, {
        params: { 'provice-code': firstProvince.code },
        headers
      });
      console.log('✅ Districts API Status:', districtsResponse.status);
      console.log('📊 Districts count:', districtsResponse.data.data?.length || 0);
      
      if (districtsResponse.data.data && districtsResponse.data.data.length > 0) {
        const firstDistrict = districtsResponse.data.data[0];
        console.log('📍 First district:', firstDistrict.name, `(${firstDistrict.code})`);
        
        // Test 3: Get wards for first district
        console.log('\n3️⃣ Testing Wards API...');
        const wardsResponse = await axios.get(`${BASE_URL}/address/wards`, {
          params: { 'districts-code': firstDistrict.code },
          headers
        });
        console.log('✅ Wards API Status:', wardsResponse.status);
        console.log('📊 Wards count:', wardsResponse.data.data?.length || 0);
        
        if (wardsResponse.data.data && wardsResponse.data.data.length > 0) {
          console.log('📍 Sample wards:');
          wardsResponse.data.data.slice(0, 5).forEach((ward, index) => {
            console.log(`   ${index + 1}. ${ward.name} (${ward.code})`);
          });
          
          if (wardsResponse.data.data.length > 5) {
            console.log(`   ... and ${wardsResponse.data.data.length - 5} more wards`);
          }
        } else {
          console.log('⚠️ No wards found for this district');
        }
        
        // Test 4: Test specific district (Hoàn Kiếm)
        console.log('\n4️⃣ Testing specific district: Hoàn Kiếm...');
        const hoanKiemWardsResponse = await axios.get(`${BASE_URL}/address/wards`, {
          params: { 'districts-code': 'Hoàn Kiếm' },
          headers
        });
        console.log('✅ Hoàn Kiếm Wards API Status:', hoanKiemWardsResponse.status);
        console.log('📊 Hoàn Kiếm wards count:', hoanKiemWardsResponse.data.data?.length || 0);
        
        if (hoanKiemWardsResponse.data.data && hoanKiemWardsResponse.data.data.length > 0) {
          console.log('📍 Hoàn Kiếm wards:');
          hoanKiemWardsResponse.data.data.forEach((ward, index) => {
            console.log(`   ${index + 1}. ${ward.name} (${ward.code})`);
          });
        }
        
      } else {
        console.log('⚠️ No districts found for this province');
      }
    } else {
      console.log('⚠️ No provinces found');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testWardsAPI(); 