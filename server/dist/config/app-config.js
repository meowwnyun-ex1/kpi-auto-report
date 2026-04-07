"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiUrl = exports.getSecurityConfig = exports.getRateLimitConfig = exports.getKpiDbConfig = exports.getCorsOrigins = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const projectRoot = process.cwd().includes('server')
    ? path_1.default.resolve(process.cwd(), '..')
    : process.cwd();
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv_1.default.config({ path: path_1.default.resolve(projectRoot, envFile) });
const config = {
    port: parseInt(process.env.API_PORT),
    host: process.env.SERVER_IP,
    cors: {
        origin: process.env.NODE_ENV === 'production'
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
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        database: process.env.DB_NAME || process.env.KPI_DB_NAME || 'kpi-db', // Use KPI DB if DB_NAME not set
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
    kpiDatabase: {
        host: process.env.KPI_DB_HOST || process.env.DB_HOST,
        port: parseInt(process.env.KPI_DB_PORT || process.env.DB_PORT),
        database: process.env.KPI_DB_NAME || 'kpi-db',
        username: process.env.KPI_DB_USER || process.env.DB_USER,
        password: process.env.KPI_DB_PASSWORD || process.env.DB_PASSWORD,
    },
};
const getCorsOrigins = () => config.cors.origin;
exports.getCorsOrigins = getCorsOrigins;
const getKpiDbConfig = () => config.kpiDatabase;
exports.getKpiDbConfig = getKpiDbConfig;
const getRateLimitConfig = () => ({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 1000 : 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
});
exports.getRateLimitConfig = getRateLimitConfig;
const getSecurityConfig = () => ({
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    bcryptRounds: 12,
    maxFileSize: 10 * 1024 * 1024,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'pdf', 'doc', 'docx'],
});
exports.getSecurityConfig = getSecurityConfig;
const getApiUrl = () => `http://${process.env.SERVER_IP}:${process.env.API_PORT}/api`;
exports.getApiUrl = getApiUrl;
exports.default = config;
