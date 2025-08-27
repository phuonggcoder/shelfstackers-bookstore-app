import { useCallback, useState } from 'react';

export const useLoadingScreen = () => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async (asyncFunction: () => Promise<any>) => {
    showLoading();
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  return {
    isLoading,
    showLoading,
    hideLoading,
    withLoading,
  };
};

