import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export default async function handler(req) {
  const prefix = req.query.prefix || "";

  const { blobs } = await list({ prefix });

  const urls = blobs.map(b => b.url);

  return NextResponse.json(urls);
}
