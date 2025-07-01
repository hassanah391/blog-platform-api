import dotenv from 'dotenv';

dotenv.config();

const dbPort = process.env.DB_PORT || 27017;
const dbHost = process.env.DB_HOST || '0.0.0.0';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME || 'blog_app';
const serverPort = process.env.SERVER_PORT || 3000;
const serverHost = process.env.SERVER_HOST || '0.0.0.0';
export const config = {
  dbPort,
  dbHost,
  dbUri: dbUser && dbPassword
    ? `mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}`
    : `mongodb://${dbHost}:${dbPort}`,
  dbName,
  serverHost,
  serverPort
};
