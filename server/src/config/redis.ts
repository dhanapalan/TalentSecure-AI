import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

let redis: Redis;

export const connectRedis = async (): Promise<Redis> => {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      return Math.min(times * 200, 2000);
    },
  });

  redis.on("error", (err: Error) => {
    logger.error("Redis connection error:", err);
  });

  redis.on("connect", () => {
    logger.debug("Redis client connected");
  });

  return redis;
};

export const getRedis = (): Redis => {
  if (!redis) {
    throw new Error("Redis not initialized — call connectRedis() first");
  }
  return redis;
};
