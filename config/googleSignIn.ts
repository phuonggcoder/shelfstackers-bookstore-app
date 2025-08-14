import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Cấu hình Google Sign-In với tất cả client IDs được hỗ trợ
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // Web Client ID (chính)
    webClientId: "346115100070-bk0aon0gtdm610c0f9hp1s161u2sr8ct.apps.googleusercontent.com",
    // webClientId: "346115100070-5n3pabau28kbh2s5uq1fmvbvu48fkd4v.apps.googleusercontent.com",

    // Android Client ID (New SHA1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25)
    // Android Client ID (Old SHA1: e8c5475a7a42db2328c778122b13baff7d8207a4)
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: ['profile', 'email'],
  });
};

// Hàm đăng nhập Google với cải thiện error handling
export const signInWithGoogle = async () => {
  try {
    console.log('🔍 Starting Google Sign-In process...');
    
    // Kiểm tra Google Play Services
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true
    });
    console.log('✅ Google Play Services OK');

    // Thực hiện Google Sign-In
    console.log('🔍 Performing Google Sign-In...');
    const userInfo = await GoogleSignin.signIn();
    console.log('✅ Google Sign-In successful');

    // Lấy idToken từ userInfo.data
    const idToken = userInfo.data?.idToken;
    if (!idToken) {
      console.error('❌ No ID token received from Google');
      throw new Error('Không thể lấy ID token từ Google');
    }

    console.log('🔍 ID Token received:', idToken.substring(0, 50) + '...');

    return {
      success: true,
      idToken: idToken,
      user: {
        id: userInfo.user?.id || '',
        name: `${userInfo.user?.givenName || ''} ${userInfo.user?.familyName || ''}`.trim(),
        email: userInfo.user?.email || '',
        photo: userInfo.user?.photo || ''
      }
    };
  } catch (error: any) {
    console.error('❌ Google Sign-In Error:', error);
    
    // Xử lý các error codes cụ thể
    if (error.code === 'SIGN_IN_CANCELLED') {
      return {
        success: false,
        error: 'Người dùng đã hủy đăng nhập'
      };
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return {
        success: false,
        error: 'Google Play Services không khả dụng'
      };
    } else if (error.code === 'SIGN_IN_REQUIRED') {
      return {
        success: false,
        error: 'Yêu cầu đăng nhập Google'
      };
    } else {
      return {
        success: false,
        error: error.message || 'Đăng nhập Google thất bại'
      };
    }
  }
};

// Hàm đăng xuất Google
export const signOutFromGoogle = async () => {
  try {
    console.log('🔍 Signing out from Google...');
    await GoogleSignin.signOut();
    console.log('✅ Google Sign-Out successful');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Google Sign-Out Error:', error);
    return {
      success: false,
      error: error.message || 'Đăng xuất Google thất bại'
    };
  }
};

// Hàm kiểm tra trạng thái đăng nhập Google
export const checkGoogleSignInStatus = async () => {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) {
      const currentUser = await GoogleSignin.getCurrentUser();
      return {
        isSignedIn: true,
        user: currentUser
      };
    }
    return {
      isSignedIn: false,
      user: null
    };
  } catch (error: any) {
    console.error('❌ Check Google Sign-In Status Error:', error);
    return {
      isSignedIn: false,
      user: null,
      error: error.message
    };
  }
}; 



