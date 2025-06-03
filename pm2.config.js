module.exports = {
  apps: [
    {
      name: 'my-node-app',
      script: 'dist/index.js',
      max_memory_restart: '300M',
    },
  ],
};
