import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.URL || 'mongodb://localhost:27017/code-editor',
  jwtSecret: process.env.TOKEN || 'your_secret_key_12345!',
  redisUrl: process.env.REDIS_URL || process.env.KV_URL || '',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  emailUser: process.env.EMAIL || '',
  emailPass: process.env.EMAIL_PASSWORD || '',
  judge0ApiKey: process.env.JUDGE0_API_KEY || '',
};

// Validate critical configurations
const required = ['redisUrl'];
const missing = required.filter(key => !config[key as keyof typeof config]);

if (missing.length > 0) {
  console.warn(`[Config Warning]: Missing key configurations: ${missing.join(', ')}`);
}