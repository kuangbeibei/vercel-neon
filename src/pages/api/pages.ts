import type { NextRequest, NextFetchEvent } from "next/server";

import zod, { string } from "zod";
import sqlstring from "sqlstring";
import { extractBody } from "@/utils";
import { Pool } from "@neondatabase/serverless";

export const config = {
  runtime: "edge",
};

const schema = zod.object({
  handle: string().max(64).min(1),
});

const createHandler = async (req: NextRequest, event: NextFetchEvent) => {
  try {
    const body = await extractBody(req);

    const { handle } = schema.parse(body);

    const sql = sqlstring.format(
      `
        INSERT INTO page (handle)
        VALUES (?);
    `,
      [handle]
    );

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    await pool.query(sql);

    event.waitUntil(pool.end());

    return new Response(
      JSON.stringify({
        handle,
      }),
      {
        status: 200,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response("parse error", {
      status: 400,
    });
  }
};

export default async function handler(req: NextRequest, event: NextFetchEvent) {
  if (req.method === "POST") {
    return createHandler(req, event);
  }

  return new Response("invalid method", {
    status: 405,
  });
}
