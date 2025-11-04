import { Redis } from "@upstash/redis";

const [token, url] = (process.env.REDIS_AUTH_KEY as string)?.split(" | ");

export const redis = new Redis({ token, url });