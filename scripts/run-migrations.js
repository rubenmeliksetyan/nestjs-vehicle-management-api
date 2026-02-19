const { execSync } = require('child_process');
const path = require('path');

process.chdir(path.resolve(__dirname, '..'));
execSync('npx sequelize-cli db:migrate', {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' },
});
