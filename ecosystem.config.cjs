/** @type {import('pm2').Config} */
const config = {
  apps: [
    {
      name: 'app-store-api',
      script: 'server/dist/api.js',
      interpreter: 'node',
      // Cluster mode - 2 instances for zero-downtime deployment
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Restart every day at 4:00 AM (avoid memory leaks, refresh connections)
      cron_restart: '0 4 * * *',
      // Graceful shutdown timeout (30 seconds)
      kill_timeout: 30000,
      // Wait for app to be ready before killing old instance
      wait_ready: true,
      // Listen timeout for ready signal
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        API_PORT: 4006,
      },
      env_development: {
        NODE_ENV: 'development',
        API_PORT: 4006,
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

module.exports = config;
