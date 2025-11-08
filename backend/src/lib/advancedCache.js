import { redisCache } from './redis.js';

class AdvancedCache {
  constructor() {
    this.defaultTTL = 1800; // 30 minutes
    this.shortTTL = 300; // 5 minutes
  }

  // Message caching with conversation-based keys
  async cacheMessages(conversationId, messages, options = {}) {
    try {
      const cacheKey = `conv:${conversationId}:msgs`;
      const ttl = options.ttl || this.defaultTTL;
      
      // Store with compression for large message sets
      const data = {
        messages: messages,
        timestamp: Date.now(),
        count: messages.length
      };
      
      await redisCache.set(cacheKey, data, ttl);
      return true;
    } catch (error) {
      console.error('Cache messages error:', error);
      return false;
    }
  }

  async getCachedMessages(conversationId) {
    try {
      const cacheKey = `conv:${conversationId}:msgs`;
      return await redisCache.get(cacheKey);
    } catch (error) {
      console.error('Get cached messages error:', error);
      return null;
    }
  }

  // Batch cache operations
  async cacheMultipleConversations(conversations) {
    const pipeline = [];
    
    conversations.forEach(({ conversationId, messages }) => {
      const cacheKey = `conv:${conversationId}:msgs`;
      const data = {
        messages: messages,
        timestamp: Date.now(),
        count: messages.length
      };
      pipeline.push(['set', cacheKey, JSON.stringify(data), 'EX', this.defaultTTL]);
    });

    try {
      await redisCache.client.multi(pipeline).exec();
      return true;
    } catch (error) {
      console.error('Batch cache error:', error);
      return false;
    }
  }

  // Cache user presence data
  async cacheUserPresence(userId, data) {
    const cacheKey = `user:${userId}:presence`;
    await redisCache.set(cacheKey, data, this.shortTTL);
  }

  async getUserPresence(userId) {
    const cacheKey = `user:${userId}:presence`;
    return await redisCache.get(cacheKey);
  }

  // Smart cache invalidation
  async invalidateConversationCache(conversationId) {
    const cacheKey = `conv:${conversationId}:msgs`;
    await redisCache.del(cacheKey);
  }

  async invalidateUserConversations(userId1, userId2) {
    const conversationId = [userId1, userId2].sort().join('_');
    await this.invalidateConversationCache(conversationId);
  }

  // Cache statistics
  async getCacheStats() {
    try {
      const keys = await redisCache.client.keys('conv:*:msgs');
      const stats = {
        totalConversations: keys.length,
        memoryUsage: await redisCache.client.info('memory')
      };
      return stats;
    } catch (error) {
      console.error('Get cache stats error:', error);
      return null;
    }
  }
}

export const advancedCache = new AdvancedCache();