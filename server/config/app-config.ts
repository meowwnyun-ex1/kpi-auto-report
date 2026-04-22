import dotenv from 'dotenv';
import { ServerConfig } from '../types/index';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env' });
} else {
  dotenv.config({ path: '.env.development' });
}

const config: ServerConfig = {
  port: parseInt(process.env.API_PORT!),
  host: process.env.SERVER_IP!,
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGINS_PROD?.split(',').map((origin) => origin.trim()) ?? [])
        : (process.env.CORS_ORIGINS_DEV?.split(',').map((origin) => origin.trim()) ?? [
            `http://${process.env.SERVER_IP}:3007`,
            `http://${process.env.SERVER_IP}:4007`,
          ]),
    credentials: true,
  },
  upload: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf'],
    destination: 'uploads',
  },
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_NAME!,
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
  },
  kpiDatabase: {
    host: process.env.KPI_DB_HOST!,
    port: parseInt(process.env.KPI_DB_PORT!),
    database: process.env.KPI_DB_NAME!,
    username: process.env.KPI_DB_USER!,
    password: process.env.KPI_DB_PASSWORD!,
  },
};

export const getCorsOrigins = () => config.cors.origin;
export const getKpiDbConfig = () => config.kpiDatabase;
export const getRateLimitConfig = () => ({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
export const getSecurityConfig = () => ({
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN!,
  bcryptRounds: 12,
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'pdf', 'doc', 'docx'],
});
export const getApiUrl = () => `http://${process.env.SERVER_IP}:${process.env.API_PORT}/api`;

export default config;
