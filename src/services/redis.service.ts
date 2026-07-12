import { Redis } from 'ioredis';
import { DatabaseConnectionFactory } from '../database/connection.factory.js';
import { RedisConnection } from '../database/connections/redis.connection.js';

export class RedisService {
  private client: Redis | null = null;

  private getClient(): Redis {
    if (!this.client) {
      const conn = DatabaseConnectionFactory.getConnection('redis') as RedisConnection;
      this.client = conn.getClient();
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.getClient().get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.getClient().set(key, value, 'EX', ttlSeconds);
      } else {
        await this.getClient().set(key, value);
      }
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.getClient().del(key);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.getClient().hget(key, field);
    } catch (error) {
      console.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.getClient().hset(key, field, value);
    } catch (error) {
      console.error(`Redis HSET error for key ${key}, field ${field}:`, error);
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.getClient().hgetall(key);
    } catch (error) {
      console.error(`Redis HGETALL error for key ${key}:`, error);
      return {};
    }
  }

  async hmset(key: string, data: Record<string, string | number>): Promise<void> {
    try {
      await this.getClient().hset(key, data);
    } catch (error) {
      console.error(`Redis HMSET error for key ${key}:`, error);
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.getClient().expire(key, ttlSeconds);
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
    }
  }
}
export const redisService = new RedisService();
