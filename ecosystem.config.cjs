const path = require('node:path');
const fs = require('node:fs');

const appRoot = process.env.WARGANET_APP_DIR || '/home/userhcm/warga-net';
const backendRoot = path.join(appRoot, 'apps/backend');
const backendEnv = path.join(backendRoot, '.env');
const envPath = fs.existsSync(backendEnv) ? backendEnv : path.join(appRoot, '.env');

module.exports = {
  apps: [
    {
      name: process.env.WARGANET_PM2_APP || 'warganet-backend',
      cwd: backendRoot,
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        // Backward compatible: gunakan apps/backend/.env jika tersedia,
        // lalu fallback ke .env lama di root repository.
        DOTENV_CONFIG_PATH: envPath,
      },
    },
  ],
};
