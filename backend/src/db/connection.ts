import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "../config.js";
import * as schema from "./schema/index.js";

const pool = mysql.createPool({
  uri: config.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "+00:00",
  charset: "utf8mb4",
});

export const db = drizzle(pool, { schema, mode: "default" });
export type Db = typeof db;
