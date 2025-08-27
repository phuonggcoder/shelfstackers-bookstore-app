import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface PendingVerification {
  email: string;
  userId: string;
  timestamp: number;
  requiresVerification: boolean;
}

export const useVerificationState = () => {
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPendingVerification();
  }, []);

  const checkPendingVerification = async () => {
    try {
      const pendingData = await AsyncStorage.getItem('pendingVerification');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        const timeDiff = Date.now() - data.timestamp;
        
        // Check if it's been less than 24 hours
        if (timeDiff < 24 * 60 * 60 * 1000) {
          setPendingVerification(data);
        } else {
          // Remove if expired
          await AsyncStorage.removeItem('pendingVerification');
          setPendingVerification(null);
        }
      }
    } catch (error) {
      console.error('Error checking verification state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePendingVerification = async (email: string, userId: string) => {
    try {
      const verificationData: PendingVerification = {
        email,
        userId,
        timestamp: Date.now(),
        requiresVerification: true,
      };
      
      await AsyncStorage.setItem('pendingVerification', JSON.stringify(verificationData));
      setPendingVerification(verificationData);
    } catch (error) {
      console.error('Error saving verification state:', error);
    }
  };

  const clearPendingVerification = async () => {
    try {
      await AsyncStorage.removeItem('pendingVerification');
      setPendingVerification(null);
    } catch (error) {
      console.error('Error clearing verification state:', error);
    }
  };

  const isVerificationExpired = (data: PendingVerification) => {
    const timeDiff = Date.now() - data.timestamp;
    return timeDiff >= 24 * 60 * 60 * 1000; // 24 hours
  };

  return {
    pendingVerification,
    isLoading,
    savePendingVerification,
    clearPendingVerification,
    checkPendingVerification,
    isVerificationExpired,
  };
};

