import { useCallback, useRef, useState } from 'react';
import { Animated } from 'react-native';

export const useBookDetailLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [loadingProgress, setLoadingProgress] = useState(0);

  const startLoading = useCallback((duration: number = 3000) => {
    // Hiện loading screen ngay lập tức
    setShowLoadingScreen(true);
    setIsLoading(true);
    setLoadingProgress(0);
    
    // Reset slide animation
    slideAnim.setValue(0);
    
    // Auto hide after duration
    setTimeout(() => {
      setIsLoading(false);
      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: -1000,
        duration: 500, // Nhanh hơn
        useNativeDriver: true,
      }).start(() => {
        setShowLoadingScreen(false);
        setLoadingProgress(0);
      });
    }, duration + 200); // Giảm delay
  }, [slideAnim]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setShowLoadingScreen(false);
    setLoadingProgress(0);
  }, []);

  const loadBookData = useCallback(async (loadFunction: () => Promise<any>) => {
    startLoading(3000); // 3 seconds for book loading
    
    try {
      const result = await loadFunction();
      return result;
    } catch (error) {
      console.error('Book loading error:', error);
      throw error;
    }
  }, [startLoading]);

  return {
    isLoading,
    showLoadingScreen,
    loadingProgress,
    slideAnim,
    startLoading,
    stopLoading,
    loadBookData,
  };
};
