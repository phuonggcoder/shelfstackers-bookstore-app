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

async function testSpecificDistrict() {
  console.log('🧪 Testing specific districts...\n');

  const districtsToTest = [
    'Dương Minh Châu',
    'Hoàn Kiếm',
    'Ba Đình',
    'Hai Bà Trưng',
    'Đống Đa'
  ];

  for (const districtName of districtsToTest) {
    try {
      console.log(`📍 Testing district: ${districtName}`);
      
      const response = await axios.get(`${BASE_URL}/address/wards`, {
        params: { 'districts-code': districtName },
        headers
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Wards count: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('📍 Wards:');
        response.data.data.forEach((ward, index) => {
          console.log(`   ${index + 1}. ${ward.name} (${ward.code})`);
        });
      } else {
        console.log('⚠️ No wards found');
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Error testing ${districtName}:`, error.message);
      console.log('---\n');
    }
  }
}

// Run the test
testSpecificDistrict(); 