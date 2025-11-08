// backend/src/lib/cache.js - UPDATED
import { redisCache } from './redis.js';

// ADD THESE MISSING FUNCTIONS:
export const cacheMessages = async (key, data, expiry = 1800) => {
  try {
    await redisCache.set(key, data, expiry);
  } catch (error) {
    console.error('Error caching messages:', error);
  }
};

export const getCachedMessages = async (key) => {
  try {
    return await redisCache.get(key);
  } catch (error) {
    console.error('Error getting cached messages:', error);
    return null;
  }
};

// Keep your existing functions below...
export const cacheUser = async (user) => {
  try {
    const cacheKey = `user:${user._id}`;
    await redisCache.set(cacheKey, user, 3600); // 1 hour cache
  } catch (error) {
    console.error('Error caching user:', error);
  }
};

// Get cached user
export const getCachedUser = async (userId) => {
  try {
    const cacheKey = `user:${userId}`;
    return await redisCache.get(cacheKey);
  } catch (error) {
    console.error('Error getting cached user:', error);
    return null;
  }
};

// ENHANCED cache functions with better error handling
export const cacheGroupMessages = async (key, data, expiry = 900) => {
  try {
    if (!redisCache.client) {
      console.log('Redis not available, skipping cache');
      return false;
    }
    
    const success = await redisCache.set(key, data, expiry);
    if (success) {
      console.log('✅ Cache set successfully for key:', key);
    } else {
      console.log('❌ Failed to set cache for key:', key);
    }
    return success;
  } catch (error) {
    console.error('❌ Error caching group messages:', error);
    return false;
  }
};

export const getCachedGroupMessages = async (key) => {
  try {
    if (!redisCache.client) {
      console.log('Redis not available, skipping cache get');
      return null;
    }
    
    const cached = await redisCache.get(key);
    if (cached) {
      console.log('✅ Cache hit for key:', key);
    } else {
      console.log('❌ Cache miss for key:', key);
    }
    return cached;
  } catch (error) {
    console.error('❌ Error getting cached group messages:', error);
    return null;
  }
};

export const invalidateGroupMessageCache = async (groupId) => {
  try {
    if (!redisCache.client) {
      console.log('Redis not available, skipping cache invalidation');
      return false;
    }
    
    // Invalidate all pages for this group
    const pattern = `group_messages:${groupId}:*`;
    const success = await redisCache.deletePattern(pattern);
    
    if (success) {
      console.log('✅ Cache invalidated for pattern:', pattern);
    } else {
      console.log('❌ Failed to invalidate cache for pattern:', pattern);
    }
    return success;
  } catch (error) {
    console.error('❌ Error invalidating group message cache:', error);
    return false;
  }
};