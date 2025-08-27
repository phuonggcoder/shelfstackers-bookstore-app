import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheConfig {
  key: string;
  duration: number; // in milliseconds
}

export class CacheManager {
  private static instance: CacheManager;
  
  private constructor() {}
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async isCacheValid(config: CacheConfig): Promise<boolean> {
    try {
      const lastUpdateKey = `${config.key}_last_update`;
      const lastUpdate = await AsyncStorage.getItem(lastUpdateKey);
      
      if (!lastUpdate) return false;
      
      const now = Date.now();
      const lastUpdateTime = parseInt(lastUpdate);
      return (now - lastUpdateTime) < config.duration;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return null;
    }
  }

  async saveToCache<T>(key: string, data: T): Promise<void> {
    try {
      const now = Date.now();
      const lastUpdateKey = `${key}_last_update`;
      
      await Promise.all([
        AsyncStorage.setItem(key, JSON.stringify(data)),
        AsyncStorage.setItem(lastUpdateKey, now.toString()),
      ]);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  async clearCache(key: string): Promise<void> {
    try {
      const lastUpdateKey = `${key}_last_update`;
      await Promise.all([
        AsyncStorage.removeItem(key),
        AsyncStorage.removeItem(lastUpdateKey),
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.includes('cached_') || key.includes('last_cache_update')
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }
}

// Predefined cache configurations
export const CACHE_CONFIGS = {
  BOOKS: { key: 'cached_books', duration: 5 * 60 * 1000 }, // 5 minutes
  CATEGORIES: { key: 'cached_categories', duration: 5 * 60 * 1000 }, // 5 minutes
  FAVORITES: { key: 'cached_favorites', duration: 2 * 60 * 1000 }, // 2 minutes
  CAMPAIGNS: { key: 'cached_campaigns', duration: 10 * 60 * 1000 }, // 10 minutes
} as const;

export default CacheManager.getInstance(); 
