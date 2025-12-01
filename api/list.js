import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export default async function handler(req) {
  const prefix = req.query.prefix || "";

  const { blobs } = await list({ prefix });

  return NextResponse.json(blobs.map(b => b.url));
}
