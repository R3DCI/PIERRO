// ===============================
//   API UPLOAD VISITORS → BUNNY
// ===============================

export const config = {
  api: {
    bodyParser: false, // obligatoire pour formidable
  },
};

import formidable from "formidable";
import fs from "fs";

// 🔥 CONFIG BUNNY STORAGE
const STORAGE_NAME = "pierro-storage";
const STORAGE_URL = `https://storage.bunnycdn.com/${STORAGE_NAME}`;
const STORAGE_KEY = "c5dc0d4b-0100-473b-88729446369f-9a9a-40fc"; // ta clé API descendante

// ===============================
//   UPLOAD D'UN FICHIER
// ===============================
async function uploadToBunny(fullPath, fileBuffer) {
  const url = `${STORAGE_URL}/${fullPath}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "AccessKey": STORAGE_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer,
  });

  return res.ok;
}

// ===============================
//        HANDLER PRINCIPAL
// ===============================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Méthode non autorisée" });
  }

  // Parse du formulaire
  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          error: "Erreur analyse formulaire",
        });
      }

      // Vérif champs
      const name = fields.name?.trim();
      const message = fields.message?.trim();
      const year = fields.year?.trim();

      if (!name || !message || !year) {
        return res.status(400).json({
          success: false,
          error: "Champs manquants",
        });
      }

      // ID unique dossier du post
      const id = Date.now().toString();
      const basePath = `videos/user/${year}/${id}`;

      // Liste fichiers up
      let uploadedFiles = [];

      const fileList = Array.isArray(files.files)
        ? files.files
        : [files.files];

      for (const f of fileList) {
        if (!f || !f.filepath) continue;

        const buffer = fs.readFileSync(f.filepath);
        const fileName = f.originalFilename;
        const filePath = `${basePath}/${fileName}`;

        const ok = await uploadToBunny(filePath, buffer);
        if (ok) uploadedFiles.push(fileName);
      }

      // Création meta.json dans Bunny
      const meta = {
        name,
        message,
        files: uploadedFiles,
        timestamp: new Date().toISOString(),
      };

      await uploadToBunny(
        `${basePath}/meta.json`,
        Buffer.from(JSON.stringify(meta, null, 2))
      );

      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "Erreur serveur",
        details: e.message,
      });
    }
  });
}
