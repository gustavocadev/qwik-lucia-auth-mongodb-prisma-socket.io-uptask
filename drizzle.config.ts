import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({
  path: '.env.local',
});

export default defineConfig({
  schema: './src/server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
