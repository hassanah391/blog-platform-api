import dotenv from 'dotenv';

dotenv.config();

const dbPort = process.env.DB_PORT || 27017;
const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME || 'blog_app';
export const config = {
  dbPort,
  dbHost,
  dbUri: dbUser && dbPassword
    ? `mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}`
    : `mongodb://${dbHost}:${dbPort}`,
  dbName,
};
