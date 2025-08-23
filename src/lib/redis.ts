import Redis from 'ioredis';

// 環境変数からRedisのURLを取得。なければエラーを投げる
// Docker Composeで設定した 'redis://redis:6379' が使われる
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined in the environment variables.");
}

// Redisクライアントのインスタンスを作成
const redis = new Redis(redisUrl);

export default redis;