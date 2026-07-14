// PM2 Ecosystem Config — Production Process Manager
// Run with: pm2 start ecosystem.config.cjs
// Then: pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name:           'litro-gas',
      script:         'server.js',
      interpreter:    'node',
      node_args:      '--experimental-vm-modules',

      // Auto-restart if it crashes
      autorestart:    true,
      max_restarts:   10,
      restart_delay:  3000,

      // Watch for file changes (disable in production, enable during development)
      watch:          false,

      // Memory limit — restart if exceeds 400MB (safe for 512MB server)
      max_memory_restart: '400M',

      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT:      3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT:      3001,
      },

      // Log files — stored in ~/.pm2/logs/
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file:     './logs/litro-error.log',
      out_file:       './logs/litro-out.log',
      merge_logs:     true,
    },
  ],
};
