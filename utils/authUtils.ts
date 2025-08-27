import { AuthResponse } from '../types/auth';

// Convert Google Sign-In response to AuthResponse format
export const convertGoogleSignInResponse = (result: any): AuthResponse => {
  if (!result.success || !result.user) {
    throw new Error('Invalid Google Sign-In response');
  }

  // Convert user format
  const authUser = {
    _id: result.user.id || result.user._id, // Backend trả về 'id'
    username: result.user.username || result.user.email,
    email: result.user.email,
    full_name: result.user.full_name || result.user.name,
    phone_number: result.user.phone_number,
    roles: result.user.roles || ['user'],
    gender: result.user.gender,
    avatar: result.user.avatar || result.user.picture,
    birthday: result.user.birthday,
  };

  // Return AuthResponse format
  return {
    token: result.access_token,
    user: authUser
  };
};

// Validate Google Sign-In response
export const validateGoogleSignInResponse = (result: any): boolean => {
  return (
    result &&
    result.success === true &&
    result.user &&
    result.access_token &&
    result.refresh_token
  );
};

// Extract user info from Google Sign-In response
export const extractUserInfo = (result: any) => {
  if (!validateGoogleSignInResponse(result)) {
    throw new Error('Invalid Google Sign-In response format');
  }

  return {
    user: result.user,
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    expiresIn: result.expires_in,
    refreshExpiresIn: result.refresh_expires_in,
    tokenType: result.token_type
  };
}; 
