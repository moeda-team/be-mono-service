module.exports = {
  apps: [
    {
      name: 'moeda',
      script: 'dist/index.js',
      max_memory_restart: '300M',
    },
  ],
};
