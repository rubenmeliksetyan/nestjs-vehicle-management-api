const path = require('path');
const root = path.resolve(__dirname, '..');
try {
  require('dotenv').config({
    path: path.join(root, '.env'),
    silent: true,
    quiet: true,
  });
  require('dotenv').config({
    path: path.join(root, '.env.local'),
    silent: true,
    quiet: true,
  });
} catch (_) {}

const base = {
  username: process.env.DB_USERNAME || 'vehicle_user',
  password: process.env.DB_PASSWORD || 'vehicle_password',
  database: process.env.DB_DATABASE || 'vehicle_management',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mysql',
  logging: false,
};

const test = {
  ...base,
  database: process.env.DB_TEST_DATABASE || 'vehicle_management_test',
  username: process.env.DB_TEST_USERNAME || 'test_vehicle_user',
  password: process.env.DB_TEST_PASSWORD || 'test_vehicle_password',
  host: process.env.DB_TEST_HOST || 'localhost',
  port: parseInt(process.env.DB_TEST_PORT || '3307', 10),
};

module.exports = {
  development: base,
  test,
  production: base,
};
