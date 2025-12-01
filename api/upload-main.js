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

  const year = req.query.year;
  if (!year) {
    return NextResponse.json({ error: "Missing year" }, { status: 400 });
  }

  const filename = `main/${year}.mp4`;

  const blob = await put(filename, req.body, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
