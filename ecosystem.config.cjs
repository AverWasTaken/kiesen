module.exports = {
  apps: [{
    name: 'kiesen',
    script: 'dist/index.js',
    cwd: '/home/ayvyr/projects/active/kiesen',
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PREFIX: '!',
      OWNER_ID: '1397912652029628608'
    },
    watch: false,
    max_memory_restart: '200M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
