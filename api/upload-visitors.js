import { NextResponse } from "next/server";

// ========== CONFIG BUNNY ==========
const STORAGE = "pierro-storage"; // ton storage
const API_KEY = process.env.BUNNY_API_KEY; // clé dans Vercel
const BASE_URL = `https://storage.bunnycdn.com/${STORAGE}`;

export const config = {
  api: { bodyParser: false }
};

// ========== HELPER : upload ==========
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
    const txt = await res.text();
    throw new Error(`Bunny upload failed (${res.status}): ${txt}`);
  }
}

// ========== HANDLER ==========
export default async function handler(req) {
  if (req.method !== "POST") {
    return NextResponse.json(
      { error: "Méthode non autorisée" },
      { status: 405 }
    );
  }

  try {
    // Lecture form-data automatiquement (PAS besoin de parser)
    const form = await req.formData();

    const name = form.get("name")?.trim();
    const message = form.get("message")?.trim();
    const year = form.get("year")?.trim();
    const files = form.getAll("files");

    if (!name || !message || !year) {
      return NextResponse.json(
        { error: "Champs manquants (nom, message, année)." },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier reçu." },
        { status: 400 }
      );
    }

    // Création dossier unique
    const postId = Date.now().toString();
    const basePath = `visitors/${year}/${postId}`;

    const fileList = [];

    // Upload de chaque fichier
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const safeName = `${i + 1}-${file.name.replace(/\s+/g, "_")}`;
      const remotePath = `${basePath}/${safeName}`;

      await bunnyUpload(remotePath, buffer);

      fileList.push(safeName);
    }

    // Création du meta.json
    const meta = {
      name,
      message,
      year,
      createdAt: Date.now(),
      files: fileList
    };

    await bunnyUpload(
      `${basePath}/meta.json`,
      Buffer.from(JSON.stringify(meta, null, 2))
    );

    return NextResponse.json({
      success: true,
      postId,
      message: "Souvenir envoyé avec succès."
    });

  } catch (err) {
    console.error("UPLOAD VISITOR ERROR:", err);
    return NextResponse.json(
      { error: "Erreur interne : " + err.message },
      { status: 500 }
    );
  }
}
