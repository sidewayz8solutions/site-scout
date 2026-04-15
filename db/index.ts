import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.VERCEL ? "/tmp/site-scout.db" : "./site-scout.db";
const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA foreign_keys = ON;");

// Create tables if missing (needed for ephemeral /tmp on Vercel)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    location TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    website TEXT,
    has_website INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS generated_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    html_path TEXT NOT NULL,
    preview_url TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS outreach (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at INTEGER,
    created_at INTEGER NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
