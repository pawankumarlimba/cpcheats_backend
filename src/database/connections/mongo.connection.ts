import mongoose from 'mongoose';
import { IDatabaseConnection } from './connection.interface.js';
import { config } from '../../config/env.js';

export class MongoConnection implements IDatabaseConnection {
  private connected: boolean = false;

  async connect(): Promise<void> {
    if (this.connected && mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected.');
      return;
    }

    try {
      await mongoose.connect(config.mongoUri);
      this.connected = true;
      console.log('MongoDB connected successfully.');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    try {
      await mongoose.disconnect();
      this.connected = false;
      console.log('MongoDB disconnected.');
    } catch (error) {
      console.error('Error disconnecting MongoDB:', error);
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}
