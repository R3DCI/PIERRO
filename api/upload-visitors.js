// =============================================
//  API UPLOAD VISITORS → BUNNYCDN (VERCEL)
// =============================================

export const config = {
  api: { bodyParser: false }
};

import formidable from "formidable";
import fs from "fs";

// Bunny Storage config
const STORAGE_NAME = "pierro-storage";
const STORAGE_URL = `https://storage.bunnycdn.com/${STORAGE_NAME}`;
const ACCESS_KEY = process.env.BUNNY_API_KEY; // 🔥 stockée dans Vercel

async function uploadToBunny(path, buffer) {
  const res = await fetch(`${STORAGE_URL}/${path}`, {
    method: "PUT",
    headers: {
      AccessKey: ACCESS_KEY,
      "Content-Type": "application/octet-stream"
    },
    body: buffer
  });
  return res.ok;
}

export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Méthode non autorisée" });

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ success: false, error: "Erreur parsing" });

    const name = fields.name?.trim();
    const message = fields.message?.trim();
    const year = fields.year?.trim();

    if (!name || !message || !year)
      return res.status(400).json({ success: false, error: "Champs manquants" });

    const id = Date.now().toString();
    const basePath = `videos/user/${year}/${id}`;
    let uploadedFiles = [];

    const fileList = Array.isArray(files.files) ? files.files : [files.files];

    for (const f of fileList) {
      const buffer = fs.readFileSync(f.filepath);
      const filePath = `${basePath}/${f.originalFilename}`;
      const ok = await uploadToBunny(filePath, buffer);
      if (ok) uploadedFiles.push(f.originalFilename);
    }

    const meta = {
      name,
      message,
      files: uploadedFiles,
      timestamp: new Date().toISOString()
    };

    await uploadToBunny(
      `${basePath}/meta.json`,
      Buffer.from(JSON.stringify(meta, null, 2))
    );

    return res.status(200).json({ success: true });
  });
}
