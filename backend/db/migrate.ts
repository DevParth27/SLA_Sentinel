// One-off migration runner. Loads secrets from .env.local, then executes
// db/migrations/schema.sql against the configured database using the same
// IAM-auth connection logic as the app (db/client.ts).
//
//   npm run migrate
//
// Safe to re-run: CREATE TABLE uses IF NOT EXISTS. (Note: the seed INSERT at
// the bottom of schema.sql has no unique constraint, so repeated runs add
// duplicate demo rows — run once, or delete the seed block first.)
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  // Require after env is loaded so the Signer reads the right config.
  const { query } = require("./client");
  const sqlPath = resolve(__dirname, "migrations/schema.sql");
  const sql = readFileSync(sqlPath, "utf8");

  console.log(`Running ${sqlPath} against ${process.env.DATABASE_PGHOST} ...`);
  await query(sql);
  console.log("✅ Migration complete");
  process.exit(0);
}

main().catch((err: any) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
