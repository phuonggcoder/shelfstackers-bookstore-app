const axios = require('axios');

const BASE_URL = 'https://server-shelf-stacker-w1ds.onrender.com';

async function testAddressAPI() {
  console.log('🧪 Testing Address API...\n');

  try {
    // Test 1: Get all provinces
    console.log('1️⃣ Testing GET /address/all-province');
    const provincesResponse = await axios.get(`${BASE_URL}/address/all-province`);
    console.log('✅ Provinces API Response:', {
      success: provincesResponse.data.success,
      code: provincesResponse.data.code,
      dataLength: provincesResponse.data.data?.length || 0,
      firstProvince: provincesResponse.data.data?.[0] || null
    });
    console.log('');

    // Test 2: Get districts for first province
    if (provincesResponse.data.data && provincesResponse.data.data.length > 0) {
      const firstProvince = provincesResponse.data.data[0];
      console.log(`2️⃣ Testing GET /address/districts?provice-code=${firstProvince.code}`);
      
      const districtsResponse = await axios.get(`${BASE_URL}/address/districts`, {
        params: { 'provice-code': firstProvince.code }
      });
      
      console.log('✅ Districts API Response:', {
        success: districtsResponse.data.success,
        code: districtsResponse.data.code,
        dataLength: districtsResponse.data.data?.length || 0,
        firstDistrict: districtsResponse.data.data?.[0] || null
      });
      console.log('');

      // Test 3: Get wards for first district
      if (districtsResponse.data.data && districtsResponse.data.data.length > 0) {
        const firstDistrict = districtsResponse.data.data[0];
        console.log(`3️⃣ Testing GET /address/wards?districts-code=${firstDistrict.code}`);
        
        const wardsResponse = await axios.get(`${BASE_URL}/address/wards`, {
          params: { 'districts-code': firstDistrict.code }
        });
        
        console.log('✅ Wards API Response:', {
          success: wardsResponse.data.success,
          code: wardsResponse.data.code,
          dataLength: wardsResponse.data.data?.length || 0,
          firstWard: wardsResponse.data.data?.[0] || null
        });
        console.log('');

        // Test 4: Try with different districts if first one has no wards
        if (wardsResponse.data.data && wardsResponse.data.data.length === 0 && districtsResponse.data.data.length > 1) {
          console.log('🔍 First district has no wards, trying second district...');
          const secondDistrict = districtsResponse.data.data[1];
          console.log(`4️⃣ Testing GET /address/wards?districts-code=${secondDistrict.code}`);
          
          const wardsResponse2 = await axios.get(`${BASE_URL}/address/wards`, {
            params: { 'districts-code': secondDistrict.code }
          });
          
          console.log('✅ Wards API Response (2nd district):', {
            success: wardsResponse2.data.success,
            code: wardsResponse2.data.code,
            dataLength: wardsResponse2.data.data?.length || 0,
            firstWard: wardsResponse2.data.data?.[0] || null
          });
          console.log('');
        }

        // Test 5: Try with Hà Nội province specifically
        console.log('🔍 Testing with Hà Nội province specifically...');
        const hanoiDistrictsResponse = await axios.get(`${BASE_URL}/address/districts`, {
          params: { 'provice-code': '01' }
        });
        
        if (hanoiDistrictsResponse.data.data && hanoiDistrictsResponse.data.data.length > 0) {
          const hanoiDistrict = hanoiDistrictsResponse.data.data[0];
          console.log(`5️⃣ Testing GET /address/wards?districts-code=${hanoiDistrict.code}`);
          
          const hanoiWardsResponse = await axios.get(`${BASE_URL}/address/wards`, {
            params: { 'districts-code': hanoiDistrict.code }
          });
          
          console.log('✅ Hà Nội Wards API Response:', {
            success: hanoiWardsResponse.data.success,
            code: hanoiWardsResponse.data.code,
            dataLength: hanoiWardsResponse.data.data?.length || 0,
            firstWard: hanoiWardsResponse.data.data?.[0] || null
          });
          console.log('');

          // Test 5.1: Try with different parameter format
          console.log(`5.1️⃣ Testing GET /address/wards?district-code=${hanoiDistrict.code}`);
          
          try {
            const hanoiWardsResponse2 = await axios.get(`${BASE_URL}/address/wards`, {
              params: { 'district-code': hanoiDistrict.code }
            });
            
            console.log('✅ Hà Nội Wards API Response (district-code):', {
              success: hanoiWardsResponse2.data.success,
              code: hanoiWardsResponse2.data.code,
              dataLength: hanoiWardsResponse2.data.data?.length || 0,
              firstWard: hanoiWardsResponse2.data.data?.[0] || null
            });
            console.log('');
          } catch (error) {
            console.log('❌ district-code parameter failed:', error.response?.status);
          }

          // Test 5.2: Try with district name instead of code
          console.log(`5.2️⃣ Testing GET /address/wards?districts-code=${hanoiDistrict.name}`);
          
          try {
            const hanoiWardsResponse3 = await axios.get(`${BASE_URL}/address/wards`, {
              params: { 'districts-code': hanoiDistrict.name }
            });
            
            console.log('✅ Hà Nội Wards API Response (district name):', {
              success: hanoiWardsResponse3.data.success,
              code: hanoiWardsResponse3.data.code,
              dataLength: hanoiWardsResponse3.data.data?.length || 0,
              firstWard: hanoiWardsResponse3.data.data?.[0] || null
            });
            console.log('');
          } catch (error) {
            console.log('❌ district name parameter failed:', error.response?.status);
          }
        }
      }
    }

    // Test 6: Search address
    console.log('6️⃣ Testing GET /address/search?q=ha noi');
    const searchResponse = await axios.get(`${BASE_URL}/address/search`, {
      params: { q: 'ha noi' }
    });
    
    console.log('✅ Search API Response:', {
      success: searchResponse.data.success,
      code: searchResponse.data.code,
      dataLength: searchResponse.data.data?.length || 0,
      firstResult: searchResponse.data.data?.[0] || null
    });
    console.log('');

    console.log('🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API Test Failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

// Run the test
testAddressAPI(); 