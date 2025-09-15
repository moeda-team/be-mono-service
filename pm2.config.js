module.exports = {
  apps: [
    {
      name: 'moeda',
      script: 'dist/index.js',
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
      watch: false,
    },
  ],
};
