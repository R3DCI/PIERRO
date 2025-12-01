// ===============================
//  UPLOAD PRINCIPALE → BUNNY CDN
// ===============================

import { NextResponse } from "next/server";

// Taille des chunks : 10 Mo
const CHUNK_SIZE = 10 * 1024 * 1024;

// Informations Bunny
const STORAGE_ZONE = "pierro-videos";
const API_KEY = process.env.BUNNY_API_KEY; 
const BASE_URL = `https://storage.bunnycdn.com/${STORAGE_ZONE}`;

// ===============================
//  UPLOAD PRINCIPAL (5 Go OK)
// ===============================

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req) {
  try {
    const year = req.query.year;
    if (!year) {
      return NextResponse.json({ error: "Année manquante." }, { status: 400 });
    }

    const filename = `${year}.mp4`;
    const fullPath = `main/${filename}`;

    // Lecture du fichier depuis la requête
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    const fileSize = fileBuffer.length;

    console.log("Taille totale fichier :", fileSize);

    // ==============================
    // 1 • INIT UPLOAD
    // ==============================

    const initRes = await fetch(`${BASE_URL}/${fullPath}`, {
      method: "PUT",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": "application/octet-stream",
        "Content-Length": 0,
        "Upload-Checksum": "true"
      }
    });

    if (!initRes.ok) {
      console.log("Erreur init :", await initRes.text());
      return NextResponse.json({ error: "Erreur init upload" }, { status: 500 });
    }

    // ==============================
    // 2 • ENVOI PAR CHUNKS
    // ==============================

    let offset = 0;
    let part = 1;

    while (offset < fileSize) {
      const end = Math.min(offset + CHUNK_SIZE, fileSize);
      const chunk = fileBuffer.slice(offset, end);

      const uploadPart = await fetch(`${BASE_URL}/${fullPath}`, {
        method: "PATCH",
        headers: {
          AccessKey: API_KEY,
          "Content-Type": "application/octet-stream",
          "Content-Range": `bytes ${offset}-${end - 1}/${fileSize}`
        },
        body: chunk
      });

      if (!uploadPart.ok) {
        console.log("Erreur part", part, ":", await uploadPart.text());
        return NextResponse.json({ error: "Erreur upload chunk" }, { status: 500 });
      }

      console.log(`Chunk ${part} envoyé (${offset} → ${end})`);
      offset = end;
      part++;
    }

    // ==============================
    // 3 • FIN UPLOAD
    // ==============================

    const completeRes = await fetch(`${BASE_URL}/${fullPath}`, {
      method: "POST",
      headers: { AccessKey: API_KEY }
    });

    if (!completeRes.ok) {
      console.log("Erreur complete :", await completeRes.text());
      return NextResponse.json({ error: "Erreur finalisation upload" }, { status: 500 });
    }

    console.log("UPLOAD TERMINÉ !");
    return NextResponse.json({
      success: true,
      url: `https://pierro-videos.b-cdn.net/main/${filename}`
    });

  } catch (err) {
    console.log("Erreur serveur :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
