import type { NextRequest, NextFetchEvent } from "next/server";
import { Pool } from "@neondatabase/serverless";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, event: NextFetchEvent) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const sql = `
        SELECT NOW()
    `;

  const { rows } = await pool.query(sql);

  const now = rows[0];

  event.waitUntil(pool.end());

  return new Response(
    JSON.stringify({
      now,
    }),
    {
      status: 200,
    }
  );
}
