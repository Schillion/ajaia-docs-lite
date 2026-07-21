#!/usr/bin/env node
/**
 * Runs a .sql file against the database referenced by SUPABASE_DB_URL
 * (or DATABASE_URL as a fallback) using the Postgres connection string
 * from your Supabase project settings (Project Settings -> Database ->
 * Connection string -> URI). Used by `npm run db:migrate` / `npm run db:seed`.
 */
import { readFile } from "node:fs/promises";
import { Client } from "pg";

const [, , sqlPath] = process.argv;

if (!sqlPath) {
  console.error("Usage: node scripts/run-sql.mjs <path-to-sql-file>");
  process.exit(1);
}

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "Missing SUPABASE_DB_URL (or DATABASE_URL). Set it to your Supabase Postgres connection string and try again."
  );
  process.exit(1);
}

const sql = await readFile(sqlPath, "utf8");

const client = new Client({
  connectionString,
  ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`Ran ${sqlPath} successfully.`);
} catch (error) {
  console.error(`Failed to run ${sqlPath}:`);
  console.error(error.message);
  process.exit(1);
} finally {
  await client.end();
}
