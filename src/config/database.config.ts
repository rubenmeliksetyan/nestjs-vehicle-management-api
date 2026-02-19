export const databaseConfig = () => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_DATABASE || 'vehicle_management',
    username: process.env.DB_USERNAME || 'vehicle_user',
    password: process.env.DB_PASSWORD || 'vehicle_password',
  },
  databaseTest: {
    host: process.env.DB_TEST_HOST || 'localhost',
    port: parseInt(process.env.DB_TEST_PORT || '3307', 10),
    database: process.env.DB_TEST_DATABASE || 'vehicle_management_test',
    username: process.env.DB_TEST_USERNAME || 'test_vehicle_user',
    password: process.env.DB_TEST_PASSWORD || 'test_vehicle_password',
  },
});
