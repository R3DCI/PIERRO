// =======================================================
//   UPLOAD VISITEURS → BUNNY STORAGE
// =======================================================

import { NextResponse } from "next/server";

export const config = {
  api: { bodyParser: false }
};

// Bunny Storage Config
const STORAGE_ZONE = "pierro-storage";              // ← ton storage
const API_KEY = process.env.BUNNY_API_KEY;         // ← clé dans Vercel
const BASE_URL = `https://storage.bunnycdn.com/${STORAGE_ZONE}`;


export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return NextResponse.json({ error: "Méthode non autorisée." }, { status: 405 });
    }

    // Lecture du formulaire (FormData)
    const form = await req.formData();
    const year = form.get("year");
    const name = form.get("name");
    const message = form.get("message");

    if (!year || !name || !message) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }

    // Tous les fichiers envoyés
    const files = form.getAll("files");
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier." }, { status: 400 });
    }

    const uploaded = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${Date.now()}-${file.name}`;
      const remotePath = `photos/${year}/${fileName}`;

      const uploadRes = await fetch(`${BASE_URL}/${remotePath}`, {
        method: "PUT",
        headers: {
          AccessKey: API_KEY,
          "Content-Type": "application/octet-stream"
        },
        body: buffer
      });

      if (!uploadRes.ok) {
        return NextResponse.json({ error: "Erreur upload Bunny." }, { status: 500 });
      }

      uploaded.push(`https://pierro-storage.b-cdn.net/photos/${year}/${fileName}`);
    }

    return NextResponse.json({
      success: true,
      year,
      name,
      message,
      files: uploaded
    });

  } catch (err) {
    console.log("Erreur serveur upload-visitors:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
