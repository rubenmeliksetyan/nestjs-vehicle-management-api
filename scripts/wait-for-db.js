const mysql = require('mysql2/promise');

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USERNAME = 'vehicle_user',
  DB_PASSWORD = 'vehicle_password',
  DB_DATABASE = 'vehicle_management',
} = process.env;

const maxRetries = 40;
const retryDelay = 2000;
const initialDelayMs = 10000;

async function waitForDatabase() {
  console.log(`Waiting ${initialDelayMs / 1000}s for MySQL to accept connections...`);
  await new Promise((r) => setTimeout(r, initialDelayMs));

  for (let i = 0; i < maxRetries; i++) {
    try {
      const connection = await mysql.createConnection({
        host: DB_HOST,
        port: Number(DB_PORT),
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE,
      });

      await connection.ping();
      await connection.end();

      console.log(`✓ Database connection successful to ${DB_HOST}:${DB_PORT}/${DB_DATABASE}`);
      process.exit(0);
    } catch (error) {
      console.log(
        `Attempt ${i + 1}/${maxRetries}: Database not ready (${DB_HOST}:${DB_PORT}) - ${error.message}`,
      );
      if (i === maxRetries - 1) {
        console.error('✗ Database connection failed after maximum retries');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

waitForDatabase();
