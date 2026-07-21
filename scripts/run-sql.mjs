#!/usr/bin/env node
/**
 * Runs a .sql file against the database referenced by SUPABASE_DB_URL
 * (or DATABASE_URL as a fallback) using the Postgres connection string
 * from your Supabase project settings (Project Settings -> Database ->
 * Connection string -> URI). Used by `npm run db:migrate` / `npm run db:seed`.
 */
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { Client } from "pg";

/** Minimal .env.local loader so this script works without a dotenv dependency. */
function loadEnvLocal() {
  const path = new URL("../.env.local", import.meta.url);
  if (!existsSync(path)) return;

  const contents = readFileSync(path, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

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
