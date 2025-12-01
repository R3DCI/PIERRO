import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET(req) {
    const prefix = new URL(req.url).searchParams.get("prefix") || "";

    const { blobs } = await list({ prefix });

    return NextResponse.json(blobs.map(b => b.url));
}
