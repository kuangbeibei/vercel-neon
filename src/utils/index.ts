import { NextRequest } from "next/server";
import { Pool } from "@neondatabase/serverless";

export const extractBody = async (req: NextRequest) => {
  if (!req.body) {
    return null;
  }

  const decoder = new TextDecoder();

  const reader = req.body.getReader();

  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      try {
        return JSON.parse(body);
      } catch (e) {
        console.error(e);
        return null;
      }
    }

    body = body + decoder.decode(value);
  }
};
