import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  environment: process.env.NODE_ENV || 'development',
  slotGranularityMinutes: 10,
  defaultTimezone: 'UTC',
}));
