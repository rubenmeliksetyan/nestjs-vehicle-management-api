const path = require('path');
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

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

const config = require('../database/config.cjs').development;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@local.dev';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: 'mysql',
    logging: false,
  },
);

async function seed() {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { replacements: { email: adminEmail } },
    );
    const exists = rows && rows.length > 0;
    if (exists) {
      console.log('Admin user already exists:', adminEmail);
      process.exit(0);
      return;
    }
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const now = new Date();
    await sequelize.query(
      `INSERT INTO users (email, full_name, password_hash, role, is_active, created_at, updated_at)
       VALUES (:email, :fullName, :passwordHash, 'ADMIN', true, :now, :now)`,
      {
        replacements: {
          email: adminEmail,
          fullName: 'Admin',
          passwordHash,
          now,
        },
      },
    );
    console.log('Admin user created:', adminEmail);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
