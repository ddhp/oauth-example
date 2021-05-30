import { RedisOptions } from 'ioredis';

interface Config {
  environment: string;
  redisConfig: RedisOptions;
  accessApiHost: string;
  lineApiHost: string;
  channelId: string;
  channelSecret: string;
  sessionMaxAge: string;
  sessionSecret: string;
}

const parseRequiredVar = (varName: string) => {
  const v = process.env[varName];
  if (!v) {
    throw new Error(`${varName} is required!!`);
  }
  return v;
};

const parseConfig = (): Config => {
  let redisConfig;
  try {
    redisConfig = process.env.AUTH_REDIS_CONFIG && JSON.parse(process.env.AUTH_REDIS_CONFIG);
  } catch (e) {
    throw new Error(`invalid AUTH_REDIS_CONFIG: ${e}`);
  }
  return {
    environment: process.env.AUTH_ENVIRONMENT || process.env.NODE_ENV || 'development',
    redisConfig: redisConfig || { host: 'redis', port: 6379 },
    accessApiHost: process.env.AUTH_ACCESS_API_HOST || 'https://access.line.me',
    lineApiHost: process.env.AUTH_LINE_API_HOST || 'https://api.line.me',
    channelId: parseRequiredVar('AUTH_CHANNEL_ID'),
    channelSecret: parseRequiredVar('AUTH_CHANNEL_SECRET'),
    sessionMaxAge: process.env.AUTH_SESSION_MAX_AGE || '1d',
    sessionSecret: process.env.AUTH_SESSION_SECRET || 'secret-for-our-session',
  };
};

export default parseConfig();
