module.exports = {
  apps: [
    {
      name: 'moeda',
      script: 'dist/index.js',
      // restart behavior
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,

      // logging
      error_file: './logs/moeda-error.log',
      out_file: './logs/moeda-out.log',
      merge_logs: true,
      time: true,

      // resources
      instances: 1, // keep 1, because you have only 1 vCPU
      exec_mode: 'fork', // 'cluster' is useful if >1 CPU
      max_memory_restart: '500M', // auto-restart if >500MB used
      watch: false, // disable watch in production (saves RAM)

      // env
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
