import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export default async function handler(req) {
  const url = req.query.url;

  await del(url);

  return NextResponse.json({ ok: true });
}
