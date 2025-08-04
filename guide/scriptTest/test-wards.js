const axios = require('axios');

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function testWards() {
  console.log('🧪 Testing Wards API with fallback data...\n');

  try {
    // Test 1: Get Hà Nội districts
    console.log('1️⃣ Getting Hà Nội districts...');
    const districtsResponse = await axios.get(`${BASE_URL}/address/districts`, {
      params: { 'provice-code': '01' }
    });
    
    if (districtsResponse.data.data && districtsResponse.data.data.length > 0) {
      const firstDistrict = districtsResponse.data.data[0];
      console.log('✅ First district:', firstDistrict.name);
      
      // Test 2: Get wards for this district
      console.log(`2️⃣ Getting wards for ${firstDistrict.name}...`);
      const wardsResponse = await axios.get(`${BASE_URL}/address/wards`, {
        params: { 'districts-code': firstDistrict.code }
      });
      
      console.log('✅ Wards Response:', {
        success: wardsResponse.data.success,
        code: wardsResponse.data.code,
        dataLength: wardsResponse.data.data?.length || 0,
        firstWard: wardsResponse.data.data?.[0] || null,
        errors: wardsResponse.data.errors || []
      });
      
      if (wardsResponse.data.data && wardsResponse.data.data.length > 0) {
        console.log('🎉 Wards are working! Sample wards:');
        wardsResponse.data.data.slice(0, 3).forEach((ward, index) => {
          console.log(`   ${index + 1}. ${ward.name} (${ward.code})`);
        });
      } else {
        console.log('⚠️ No wards returned from API');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWards(); 