import { Redis } from "@upstash/redis";

const [url, token] = (process.env.REDIS_AUTH_KEY as string)?.split(" | ");

export const redis = new Redis({ token, url });