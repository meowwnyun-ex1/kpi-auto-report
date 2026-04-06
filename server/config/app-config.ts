import dotenv from 'dotenv';
import path from 'path';
import { ServerConfig } from '../types/index';

const projectRoot = process.cwd().includes('server')
  ? path.resolve(process.cwd(), '..')
  : process.cwd();
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: path.resolve(projectRoot, envFile) });

const config: ServerConfig = {
  port: parseInt(process.env.API_PORT!),
  host: process.env.SERVER_IP!,
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGINS_PROD?.split(',').map((origin) => origin.trim()) ?? [])
        : (process.env.CORS_ORIGINS_DEV?.split(',').map((origin) => origin.trim()) ?? [
            `http://${process.env.SERVER_IP}:3006`,
            `http://${process.env.SERVER_IP}:4006`,
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
};

export const getCorsOrigins = () => config.cors.origin;
export const getAppStoreDbConfig = () => config.database;
export const getRateLimitConfig = () => ({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
export const getSecurityConfig = () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  bcryptRounds: 12,
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'pdf', 'doc', 'docx'],
});
export const getApiUrl = () => `http://${process.env.SERVER_IP}:${process.env.API_PORT}/api`;

export default config;
