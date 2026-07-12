import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { attachMCPSSE } from './mcp/mcp.server.js';

const app = express();

// Apply Midlewares
app.use(cors({
  origin: '*', // Allow all origins for the dev/test client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
