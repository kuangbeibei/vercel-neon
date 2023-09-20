import { extractBody } from "@/utils";
import type { NextRequest, NextFetchEvent } from "next/server";
import zod, { string } from "zod";
import { v4 as uuidV4 } from "uuid";
import sqlstring from "sqlstring";
import { Pool } from "@neondatabase/serverless";

export const config = {
  runtime: "edge",
};

const createCommentSchema = zod.object({
  page: string().max(64).min(1),
  comment: string().max(256),
});

const createCommentHandler = async (
  req: NextRequest,
  event: NextFetchEvent
) => {
  const body = await extractBody(req);

  const { page, comment } = createCommentSchema.parse(body);

  const id = uuidV4();

  const createCommentQuery = sqlstring.format(
    `
        INSERT INTO comment (id, page, comment)
        values(?, ?, ?)
    `,
    [id, page, comment]
  );

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pool.query(createCommentQuery);
    return new Response(
      JSON.stringify({
        id,
      }),
      {
        status: 200,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response("page not found", {
      status: 404,
    });
  } finally {
    event.waitUntil(pool.end());
  }
};

const readCommentHandler = async (req: NextRequest, event: NextFetchEvent) => {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page");

  if (!page)
    return new Response(`page not found`, {
      status: 404,
    });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const getCommentsQuery = sqlstring.format(
    `
        SELECT id, comment, created_at
        FROM comment
        WHERE page = ?
        ORDER BY created_at DESC;
     `,
    [page]
  );

  try {
    const { rows: commentRows } = await pool.query(getCommentsQuery);
    return new Response(JSON.stringify(commentRows), {
      status: 200,
    });
  } catch (e) {
    console.error(e);
    return new Response("page not found", {
      status: 404,
    });
  } finally {
    event.waitUntil(pool.end());
  }
};

export default async function handler(req: NextRequest, event: NextFetchEvent) {
  if (req.method === "POST") {
    return createCommentHandler(req, event);
  }

  if (req.method === "GET") {
    return readCommentHandler(req, event);
  }

  return new Response("invalid method", {
    status: 405,
  });
}
