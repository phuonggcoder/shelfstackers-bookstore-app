import { useCallback, useState } from 'react';
import emailService from '../services/emailService';

interface UseEmailVerificationReturn {
  loading: boolean;
  error: string | null;
  sendOTP: (email: string) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  resendOTP: (email: string) => Promise<boolean>;
  clearError: () => void;
}

export const useEmailVerification = (): UseEmailVerificationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOTP = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await emailService.sendRegistrationOTP(email);
      return response.success;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await emailService.verifyEmailOTP(email, otp);
      return response.success;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await emailService.resendOTP(email);
      return response.success;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    sendOTP,
    verifyOTP,
    resendOTP,
    clearError,
  };
};
