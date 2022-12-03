import { createClient as redisCreateClient, RedisClientOptions } from 'redis';

const redisOptions: RedisClientOptions = {
  socket: {
    host: process.env.REDIS_ENDPOINT!,
    port: +process.env.REDIS_PORT!,
  },

  // password: process.env.REDIS_PASSWORD!
};

const redis = redisCreateClient(redisOptions);

redis
.on("warning", (x) => console.warn(`Redis (Warning): ${x}`))
.on("error", (error) => {
  console.error(`Redis (Error): ${error}`);
  return process.exit(1);
})
.on("ready", () => {
  console.log("Redis: Ready.");
})

export default redis;