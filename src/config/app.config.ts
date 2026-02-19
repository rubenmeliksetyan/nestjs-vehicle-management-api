export const appConfig = () => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@local.dev',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
  },
});
