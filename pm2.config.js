module.exports = {
  apps: [
    {
      name: 'moeda',
      script: './dist/index.js', // or your main entry point
      instances: 1,
      exec_mode: 'fork', // or 'cluster' for multiple instances
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001,
      },
      // Health check endpoint for PM2
      health_check_http: {
        path: '/health',
        port: process.env.PORT || 3001,
      },
      // Restart settings
      max_restarts: 3,
      min_uptime: '10s',
      max_memory_restart: '500M',
      // Logging
      log_file: './logs/app.log',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
