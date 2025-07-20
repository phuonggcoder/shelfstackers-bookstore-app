import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Firebase Configuration for Google Sign-In
export const configureGoogleSignIn = () => {
  console.log('🔧 Configuring Google Sign-In...');
  console.log('🔧 Web Client ID:', '346115100070-bk0aon0gtdm610c0f9hp1s161u2sr8ct.apps.googleusercontent.com');
  
  GoogleSignin.configure({
    webClientId: '346115100070-bk0aon0gtdm610c0f9hp1s161u2sr8ct.apps.googleusercontent.com', // Firebase Web Client ID (type 3)
    offlineAccess: false,
  });
  
  console.log('✅ Google Sign-In configured');
}; 



