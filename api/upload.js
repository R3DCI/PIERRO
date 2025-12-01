import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const blob = await put(req.headers.get("x-file-name"), req.body, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
