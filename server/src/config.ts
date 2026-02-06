import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL!,
  geminiApiKey: process.env.GEMINI_API_KEY!,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
};

const required = ['DATABASE_URL', 'GEMINI_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
