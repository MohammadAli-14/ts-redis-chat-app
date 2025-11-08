// backend/src/lib/redis.js
import Redis from 'ioredis';
import { ENV } from './env.js';

class RedisCache {
  constructor() {
    // Use Redis URL from environment or default to localhost
    const redisUrl = ENV.REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });
    
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection failed:', error);
      // Don't throw error - app should work without Redis
    }
  }

  async set(key, value, expiry = 3600) {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', expiry);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  // Delete multiple keys by pattern
  async deletePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delete pattern error:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const redisCache = new RedisCache();

// Initialize connection
redisCache.connect().catch(console.error);
