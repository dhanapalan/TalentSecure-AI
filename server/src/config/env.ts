import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  AI_ENGINE_URL: process.env.AI_ENGINE_URL || "http://localhost:8000",

  // PostgreSQL
  PG_HOST: process.env.PG_HOST || "localhost",
  PG_PORT: parseInt(process.env.PG_PORT || "5432", 10),
  PG_USER: process.env.PG_USER || "talentsecure",
  PG_PASSWORD: process.env.PG_PASSWORD || "secret",
  PG_DATABASE: process.env.PG_DATABASE || "talentsecure_db",

  // Redis
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "dev-jwt-secret-talentsecure-2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // MinIO / S3
  S3_ENDPOINT: process.env.S3_ENDPOINT || "http://localhost:9000",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || "minioadmin",
  S3_SECRET_KEY: process.env.S3_SECRET_KEY || "minioadmin",
  S3_BUCKET: process.env.S3_BUCKET || "talentsecure",
  S3_REGION: process.env.S3_REGION || "us-east-1",

  // AI Engine service-to-service API key
  AI_ENGINE_API_KEY: process.env.AI_ENGINE_API_KEY || "dev-ai-engine-key",

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o",

  // Judge0 (code execution sandbox)
  JUDGE0_API_URL: process.env.JUDGE0_API_URL || "http://localhost:2358",
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || "",
} as const;
