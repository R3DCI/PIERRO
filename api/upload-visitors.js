// =======================================================
//   UPLOAD VISITEURS → BUNNY STORAGE
// =======================================================

import { NextResponse } from "next/server";
import crypto from "crypto";

export const config = {
  api: { bodyParser: false }
};

// Bunny Storage Config
const STORAGE_ZONE = "pierro-storage"; // ta zone pour les photos
const API_KEY = process.env.BUNNY_API_KEY;
const BASE_URL = `https://storage.bunnycdn.com/${STORAGE_ZONE}`;


// ========== UPLOAD DIRECT BUNNY ==========
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
    console.log("UPLOAD ERROR :", await res.text());
    throw new Error("Erreur Bunny Storage");
  }
}


// ========== MAIN ==========
export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
    }

    const form = await req.formData();

    const name = form.get("name");
    const message = form.get("message");
    const year = form.get("year");
    const files = form.getAll("files");

    if (!name || !message || !year) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    // ===== ID unique du post =====
    const postId = crypto.randomBytes(6).toString("hex");

    // ===== Chemin dossier =====
    const basePath = `visitors/${year}/${postId}`;

    // ===== Upload des fichiers =====
    const fileList = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const buffer = Buffer.from(await f.arrayBuffer());
      const safeName = f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const remoteName = `file_${i + 1}_${safeName}`;

      await bunnyUpload(`${basePath}/${remoteName}`, buffer);

      fileList.push(remoteName);
    }

    // ===== meta.json =====
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
      message: "Souvenir envoyé",
      postId: postId,
      year: year
    });

  } catch (err) {
    console.log("UPLOAD VISITORS SERVER ERROR :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
