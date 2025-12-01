import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req) {
  const year = req.query.year;

  const blob = await put(`main/${year}.mp4`, req.body, {
    access: "public"
  });

  return NextResponse.json({ url: blob.url });
}
