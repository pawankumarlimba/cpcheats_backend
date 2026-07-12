import { IDatabaseConnection } from './connections/connection.interface.js';
import { MongoConnection } from './connections/mongo.connection.js';
import { RedisConnection } from './connections/redis.connection.js';

export type DatabaseType = 'mongo' | 'redis';

export class DatabaseConnectionFactory {
  private static connections: Map<DatabaseType, IDatabaseConnection> = new Map();

  static getConnection(type: DatabaseType): IDatabaseConnection {
    if (this.connections.has(type)) {
      return this.connections.get(type)!;
    }

    let connection: IDatabaseConnection;
    switch (type) {
      case 'mongo':
        connection = new MongoConnection();
        break;
      case 'redis':
        connection = new RedisConnection();
        break;
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }

    this.connections.set(type, connection);
    return connection;
  }

  static async connectAll(): Promise<void> {
    for (const [type, conn] of this.connections.entries()) {
      try {
        await conn.connect();
      } catch (err) {
        console.error(`Failed to connect to ${type}:`, err);
      }
    }
  }

  static async disconnectAll(): Promise<void> {
    for (const [type, conn] of this.connections.entries()) {
      try {
        await conn.disconnect();
      } catch (err) {
        console.error(`Failed to disconnect from ${type}:`, err);
      }
    }
  }
}
