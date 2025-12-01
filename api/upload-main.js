import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const year = req.query.year;
    if (!year) {
      return res.status(400).json({ error: "Missing year parameter" });
    }

    // Récupérer le stream brut (nécessaire pour fichiers volumineux)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Upload vers Vercel Blob
    const blob = await put(`main/${year}.mp4`, buffer, {
      access: "public",
      addRandomSuffix: false, // pour écraser la vidéo existante de l’année
    });

    return res.status(200).json({
      success: true,
      url: blob.url,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
