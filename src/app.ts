import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { attachMCPSSE } from './mcp/mcp.server.js';
import { DatabaseConnectionFactory } from './database/connection.factory.js';

const app = express();

// Apply Middlewares
app.use(cors({
  origin: '*', // Allow all origins for the dev/test client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Serverless-safe DB connection handling ---
// Vercel functions don't run index.ts's startServer(), so connection
// must be guaranteed here, before any DB-dependent route executes.
let mongoConnectPromise: Promise<unknown> | null = null;
let redisConnectPromise: Promise<unknown> | null = null;

const ensureMongoConnected = async () => {
  const mongoConnection = DatabaseConnectionFactory.getConnection('mongo');

  // Reuse an in-flight or completed connection across invocations
  // (Vercel can reuse the same warm container between requests)
  if (!mongoConnectPromise) {
    mongoConnectPromise = mongoConnection.connect().catch((err) => {
      // Reset so the next request can retry instead of being stuck
      // with a permanently rejected promise
      mongoConnectPromise = null;
      throw err;
    });
  }

  return mongoConnectPromise;
};

const ensureRedisConnected = async () => {
  const redisConnection = DatabaseConnectionFactory.getConnection('redis');

  if (!redisConnectPromise) {
    redisConnectPromise = redisConnection.connect().catch((err) => {
      redisConnectPromise = null;
      // Redis is non-critical — don't block requests on it
      console.warn('[Warning] Redis connection failed, cache operations will fall back.', err);
      return null;
    });
  }

  return redisConnectPromise;
};

app.use(async (req, res, next) => {
  // Let /health pass through without waiting on DB, so it always
  // reflects that the server process itself is alive
  if (req.path === '/health') {
    return next();
  }

  try {
    await ensureMongoConnected();
    // Don't await/block on Redis — fire and forget
    ensureRedisConnected();
    next();
  } catch (err) {
    console.error('Critical: Database connection failed for request:', err);
    res.status(503).json({
      message: 'Service temporarily unavailable',
      error: 'Database connection failed',
    });
  }
});

// Test Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Master Routes
app.use('/api', routes);

// Attach Model Context Protocol SSE handlers
attachMCPSSE(app);

// Error handling middleware
app.use(errorMiddleware);

export default app;