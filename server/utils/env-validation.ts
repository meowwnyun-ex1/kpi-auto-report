import { logger } from './logger';

interface EnvVar {
  name: string;
  required: boolean;
  default?: string;
}

const ENV_VARS: EnvVar[] = [
  // App Store Database
  { name: 'DB_HOST', required: true },
  { name: 'DB_NAME', required: true },
  { name: 'DB_USER', required: true },
  { name: 'DB_PASSWORD', required: true },
  { name: 'DB_PORT', required: true },

  // Application
  { name: 'NODE_ENV', required: true },
  { name: 'API_PORT', required: true },
  { name: 'FRONTEND_PORT', required: false },
  { name: 'SERVER_IP', required: true },

  // JWT
  { name: 'JWT_SECRET', required: true },
  { name: 'JWT_EXPIRES_IN', required: true },

  // CORS
  { name: 'CORS_ORIGINS_PROD', required: true },
  { name: 'CORS_ORIGINS_DEV', required: false },

  // Logging
  { name: 'LOG_LEVEL', required: true },
];

export const validateEnvironment = (): void => {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value && envVar.required) {
      missing.push(envVar.name);
    }
  }

  // JWT_SECRET strength check
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    warnings.push('JWT_SECRET is too short (minimum 32 characters recommended)');
  }
  if (jwtSecret === 'CHANGE_ME_TO_A_STRONG_RANDOM_SECRET') {
    missing.push('JWT_SECRET (still using placeholder value)');
  }

  // Log warnings
  for (const warning of warnings) {
    logger.warn(`Environment: ${warning}`);
  }

  // Fail on missing required vars
  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(message);
    throw new Error(message);
  }

  logger.info('Environment validation passed');
};
