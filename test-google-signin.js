// Test Google Sign-In Configuration
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Google Sign-In Configuration...\n');

// 1. Check google-services.json
const googleServicesPath = path.join(__dirname, 'android', 'app', 'google-services.json');
if (fs.existsSync(googleServicesPath)) {
  console.log('✅ google-services.json exists');
  const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
  const clients = googleServices.client[0].oauth_client;
  console.log('📋 Found', clients.length, 'OAuth clients:');
  clients.forEach((client, index) => {
    console.log(`  ${index + 1}. ${client.client_id} (type: ${client.client_type})`);
    if (client.android_info) {
      console.log(`     SHA-1: ${client.android_info.certificate_hash}`);
    }
  });
} else {
  console.log('❌ google-services.json not found');
}

// 2. Check config file
const configPath = path.join(__dirname, 'config', 'googleSignIn.ts');
if (fs.existsSync(configPath)) {
  console.log('\n✅ googleSignIn.ts exists');
  const configContent = fs.readFileSync(configPath, 'utf8');
  const webClientIdMatch = configContent.match(/webClientId:\s*['"]([^'"]+)['"]/);
  if (webClientIdMatch) {
    console.log('📋 Web Client ID:', webClientIdMatch[1]);
  }
} else {
  console.log('\n❌ googleSignIn.ts not found');
}

// 3. Check strings.xml
const stringsPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
if (fs.existsSync(stringsPath)) {
  console.log('\n✅ strings.xml exists');
  const stringsContent = fs.readFileSync(stringsPath, 'utf8');
  if (stringsContent.includes('server_client_id')) {
    console.log('✅ server_client_id found in strings.xml');
  } else {
    console.log('❌ server_client_id not found in strings.xml');
  }
} else {
  console.log('\n❌ strings.xml not found');
}

// 4. Check app.json
const appJsonPath = path.join(__dirname, 'app.json');
if (fs.existsSync(appJsonPath)) {
  console.log('\n✅ app.json exists');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  if (appJson.expo.android?.googleServicesFile) {
    console.log('✅ googleServicesFile configured in app.json');
  } else {
    console.log('❌ googleServicesFile not configured in app.json');
  }
  
  if (appJson.expo.plugins?.some(p => p[0] === '@react-native-google-signin/google-signin')) {
    console.log('✅ Google Sign-In plugin configured in app.json');
  } else {
    console.log('❌ Google Sign-In plugin not configured in app.json');
  }
} else {
  console.log('\n❌ app.json not found');
}

console.log('\n🎯 Configuration test completed!'); 