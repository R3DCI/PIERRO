// =======================================================
//   UPLOAD VISITEURS → BUNNY STORAGE
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

// ===== Envoi direct sur Bunny =====
async function bunnyUpload(path, buffer) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method: "PUT",
    headers: {
      AccessKey: API_KEY,
      "Content-Type": "application/octet-stream"
    },
    body: buffer
  });

  if (!res.ok) {
    console.log("BUNNY ERROR:", await res.text());
    throw new Error("Erreur Bunny Storage");
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

    // Lecture du formulaire
    const form = await req.formData();

    const name = form.get("name")?.trim();
    const message = form.get("message")?.trim();
    const year = form.get("year")?.trim();
    const files = form.getAll("files");

    if (!name || !message || !year) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    // ID unique du post
    const postId = crypto.randomBytes(5).toString("hex");

    // Exemple : visitors/2025/abc123/
    const basePath = `visitors/${year}/${postId}`;

    const fileList = [];

    // Upload chaque fichier
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const buffer = Buffer.from(await f.arrayBuffer());
      const safeName = f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const remoteName = `file_${i + 1}_${safeName}`;

      await bunnyUpload(`${basePath}/${remoteName}`, buffer);

      fileList.push(remoteName);
    }

    // Création du meta.json
    const meta = {
      name,
      message,
      year,
      createdAt: Date.now(),
      files: fileList
    };

    await bunnyUpload(`${basePath}/meta.json`, Buffer.from(JSON.stringify(meta, null, 2)));

    return NextResponse.json({
      success: true,
      message: "Souvenir ajouté",
      postId,
      year
    });

  } catch (err) {
    console.log("UPLOAD VISITORS SERVER ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
