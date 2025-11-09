import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

// Create PostgreSQL connection
const connectionString = process.env.DATABASE_URL!;

// For Supabase pooler, disable prepare mode
const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require'
});

// Create Drizzle instance with all schemas
export const db = drizzle(client, { schema });

// Test connection function
export async function connectDatabase() {
  try {
    await client`SELECT 1`;
    console.log('✅ Database connected successfully!');
    console.log('📊 Database: Supabase PostgreSQL');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await client.end();
  process.exit(0);
});