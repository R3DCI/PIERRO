// ==================================================
//  UPLOAD VIDÉO PRINCIPALE → BUNNY STORAGE (PATCH)
// ==================================================

import { NextResponse } from "next/server";

export const config = {
  api: { bodyParser: false }
};

// ====== CONFIG BUNNY ======
const STORAGE_ZONE = "pierro-videos"; // ta zone vidéos
const API_KEY = process.env.BUNNY_API_KEY;
const BASE_URL = `https://storage.bunnycdn.com/${STORAGE_ZONE}`;

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 Mo

export default async function handler(req) {
  try {
    const year = req.query.year;
    if (!year) {
      return NextResponse.json({ error: "Année manquante." }, { status: 400 });
    }

    const filename = `${year}.mp4`;
    const remotePath = `videos/main/${filename}`;

    // ====== Lecture du fichier envoyé ======
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const buffer = Buffer.concat(chunks);
    const size = buffer.length;

    console.log("Taille fichier :", size, "octets");

    // ====== 1. INIT ======
    const init = await fetch(`${BASE_URL}/${remotePath}`, {
      method: "PUT",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": "application/octet-stream"
      }
    });

    if (!init.ok) {
      console.log(await init.text());
      return NextResponse.json({ error: "Erreur init upload" }, { status: 500 });
    }

    // ====== 2. ENVOI PAR CHUNKS ======
    let offset = 0;
    while (offset < size) {
      const end = Math.min(offset + CHUNK_SIZE, size);
      const chunk = buffer.slice(offset, end);

      const upload = await fetch(`${BASE_URL}/${remotePath}`, {
        method: "PATCH",
        headers: {
          AccessKey: API_KEY,
          "Content-Type": "application/octet-stream",
          "Content-Range": `bytes ${offset}-${end - 1}/${size}`
        },
        body: chunk
      });

      if (!upload.ok) {
        console.log("Erreur chunk :", await upload.text());
        return NextResponse.json({ error: "Erreur upload chunk" }, { status: 500 });
      }

      console.log(`Chunk OK : ${offset} → ${end}`);
      offset = end;
    }

    // ====== 3. FINALISATION ======
    const done = await fetch(`${BASE_URL}/${remotePath}`, {
      method: "POST",
      headers: { AccessKey: API_KEY }
    });

    if (!done.ok) {
      console.log(await done.text());
      return NextResponse.json({ error: "Erreur finalisation" }, { status: 500 });
    }

    // ====== OK ======
    return NextResponse.json({
      success: true,
      url: `https://pierro-videos.b-cdn.net/videos/main/${filename}`
    });

  } catch (e) {
    console.log("Erreur serveur upload-main :", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
