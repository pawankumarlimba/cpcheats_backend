import { Redis } from 'ioredis';
import { IDatabaseConnection } from './connection.interface.js';
import { config } from '../../config/env.js';

export class RedisConnection implements IDatabaseConnection {
  private client: Redis | null = null;
  private connected: boolean = false;

  async connect(): Promise<void> {
    if (this.client && this.connected) {
      return;
    }

    if (!config.redisUrl) {
      console.warn('Redis URL is empty. Skipping Redis connection.');
      return;
    }

    try {
      this.client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.client.connect();
      this.connected = true;
      console.log('Redis connected successfully.');
    } catch (error) {
      console.error('Redis connection failed:', error);
      this.connected = false;
      this.client = null;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      this.client = null;
      console.log('Redis disconnected.');
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }
}
