// =======================================================
//   UPLOAD VISITEURS → BUNNY STORAGE (CHUNK SAFE VERSION)
// =======================================================

import { NextResponse } from "next/server";
import crypto from "crypto";

export const config = {
  api: { bodyParser: false }
};

// ===== CONFIG BUNNY =====
const STORAGE_ZONE = "pierro-storage";
const API_KEY = process.env.BUNNY_API_KEY;
const BASE_URL = `https://storage.bunnycdn.com/${STORAGE_ZONE}`;

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 Mo : parfait pour Vercel


// =======================================================
//   UPLOAD CHUNK SÉCURISÉ POUR BUNNY
// =======================================================
async function bunnyUploadChunked(path, buffer) {
  // ----- 1. INIT -----
  let init = await fetch(`${BASE_URL}/${path}`, {
    method: "PUT",
    headers: {
      AccessKey: API_KEY,
      "Content-Type": "application/octet-stream"
    }
  });

  if (!init.ok) {
    console.log("INIT ERROR:", await init.text());
    throw new Error("Erreur init Bunny");
  }

  // ----- 2. SEND CHUNKS -----
  let offset = 0;
  const size = buffer.length;

  while (offset < size) {
    const end = Math.min(offset + CHUNK_SIZE, size);
    const chunk = buffer.slice(offset, end);

    let part = await fetch(`${BASE_URL}/${path}`, {
      method: "PATCH",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": "application/octet-stream",
        "Content-Range": `bytes ${offset}-${end - 1}/${size}`
      },
      body: chunk
    });

    if (!part.ok) {
      console.log("CHUNK ERROR:", await part.text());
      throw new Error("Erreur chunk Bunny");
    }

    offset = end;
  }

  // ----- 3. FINALISATION -----
  const finish = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: { AccessKey: API_KEY }
  });

  if (!finish.ok) {
    console.log("FINAL ERROR:", await finish.text());
    throw new Error("Erreur finalisation");
  }
}


// =======================================================
//   MAIN HANDLER
// =======================================================
export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json({ error: "Méthode interdite" }, { status: 405 });
    }

    // Lecture FormData
    const form = await req.formData();

    const name = form.get("name")?.trim();
    const message = form.get("message")?.trim();
    const year = form.get("year")?.trim();
    const files = form.getAll("files");

    if (!name || !message || !year) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    // ID unique
    const postId = crypto.randomBytes(6).toString("hex");
    const basePath = `visitors/${year}/${postId}`;

    let fileList = [];

    // Upload des fichiers
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const buffer = Buffer.from(await f.arrayBuffer());
      const safeName = f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const remoteName = `file_${i + 1}_${safeName}`;
      const remotePath = `${basePath}/${remoteName}`;

      await bunnyUploadChunked(remotePath, buffer);

      fileList.push(remoteName);
    }

    // meta.json
    const meta = {
      name,
      message,
      year,
      createdAt: Date.now(),
      files: fileList
    };

    await bunnyUploadChunked(
      `${basePath}/meta.json`,
      Buffer.from(JSON.stringify(meta, null, 2))
    );

    return NextResponse.json({
      success: true,
      postId,
      year,
      message: "Souvenir ajouté ✔"
    });

  } catch (err) {
    console.log("UPLOAD VISITEURS ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
