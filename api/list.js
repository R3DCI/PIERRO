import { NextResponse } from "next/server";

// Bunny Config
const STORAGE_ZONE = "pierro-storage";
const API_KEY = process.env.BUNNY_API_KEY;
const BASE_URL = `https://storage.bunnycdn.com/${STORAGE_ZONE}`;

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req) {
  try {
    const year = req.query.year;

    if (!year) {
      return NextResponse.json(
        { error: "Année manquante" },
        { status: 400 }
      );
    }

    // 1) Récupérer la liste des dossiers pour l'année
    const listRes = await fetch(`${BASE_URL}/visitors/${year}/`, {
      method: "GET",
      headers: { AccessKey: API_KEY },
    });

    if (!listRes.ok) {
      return NextResponse.json(
        { error: "Impossible de lister les dossiers" },
        { status: 500 }
      );
    }

    const folders = await listRes.json();

    const posts = [];

    // 2) Parcourir chaque dossier de post
    for (const entry of folders) {
      if (!entry.IsDirectory) continue;

      const postId = entry.ObjectName;

      // Charger meta.json
      const metaRes = await fetch(
        `${BASE_URL}/visitors/${year}/${postId}/meta.json`,
        {
          method: "GET",
          headers: { AccessKey: API_KEY },
        }
      );

      if (!metaRes.ok) continue; // on ignore les dossiers vides

      const meta = await metaRes.json();
      meta.id = postId;

      posts.push(meta);
    }

    return NextResponse.json(posts);
  } catch (err) {
    console.log("LIST ERROR:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
