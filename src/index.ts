import app from './app.js';
import { config } from './config/env.js';
import { DatabaseConnectionFactory } from './database/connection.factory.js';

const startServer = async () => {
  try {
    console.log('Initializing database connections...');

    // Get connection objects
    const mongoConnection = DatabaseConnectionFactory.getConnection('mongo');
    const redisConnection = DatabaseConnectionFactory.getConnection('redis');

    // Connect databases
    await mongoConnection.connect();
    
    try {
      await redisConnection.connect();
    } catch (redisError) {
      console.warn('[Warning] Redis connection failed, cache operations will fall back.', redisError);
    }

    // Start Express server
    const server = app.listen(config.port, () => {
      console.log(`=================================================`);
      console.log(`  Backend Server is running on port ${config.port}`);
      console.log(`  Health Check: http://localhost:${config.port}/health`);
      console.log(`  MCP SSE URL: http://localhost:${config.port}/mcp`);
      console.log(`=================================================`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP Server closed.');
        await DatabaseConnectionFactory.disconnectAll();
        console.log('Database connections cleaned up.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Critical: Failed to start backend server:', error);
    process.exit(1);
  }
};

startServer();
