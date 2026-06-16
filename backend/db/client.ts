import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";

const signer = new Signer({
  hostname: process.env.DATABASE_PGHOST!,
  port: Number(process.env.DATABASE_PGPORT) || 5432,
  username: process.env.DATABASE_PGUSER!,
  region: process.env.DATABASE_AWS_REGION || "us-east-1",
});

let pool: Pool;

async function createPool(): Promise<Pool> {
  const token = await signer.getAuthToken();
  return new Pool({
    host: process.env.DATABASE_PGHOST,
    port: Number(process.env.DATABASE_PGPORT) || 5432,
    user: process.env.DATABASE_PGUSER,
    database: process.env.DATABASE_PGDATABASE,
    password: token,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = await createPool();
  }
  return pool;
}

export async function query(text: string, params?: any[]): Promise<any> {
  const p = await getPool();
  return p.query(text, params);
}

export async function testConnection(): Promise<void> {
  try {
    const result = await query("SELECT NOW()");
    console.log("✅ DB connected:", result.rows[0].now);
  } catch (err: any) {
    console.error("❌ DB connection failed:", err.message);
    console.log("⚠️  Backend will use seed fallback data for demo");
  }
}

export { pool };
