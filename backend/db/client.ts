import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";

const signer = new Signer({
  hostname: process.env.DATABASE_PGHOST!,
  port: Number(process.env.DATABASE_PGPORT) || 5432,
  username: process.env.DATABASE_PGUSER!,
  region: process.env.DATABASE_AWS_REGION || "us-east-1",
});

let pool: Pool;

function createPool(): Pool {
  return new Pool({
    host: process.env.DATABASE_PGHOST,
    port: Number(process.env.DATABASE_PGPORT) || 5432,
    user: process.env.DATABASE_PGUSER,
    database: process.env.DATABASE_PGDATABASE,
    // Mint a fresh IAM auth token for every new physical connection. RDS IAM
    // tokens expire after ~15 min, so a long-lived (warm serverless) pool must
    // not reuse a single token captured at pool-creation time. pg calls this
    // function each time it opens a new connection.
    password: () => signer.getAuthToken(),
    ssl: { rejectUnauthorized: false },
    // Keep this small: each warm serverless instance holds its own pool, so a
    // large max across many instances can exhaust RDS connections.
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function query(text: string, params?: any[]): Promise<any> {
  return getPool().query(text, params);
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
