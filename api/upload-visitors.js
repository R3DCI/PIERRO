// ===============================
//   API UPLOAD VISITORS → BUNNY
// ===============================

export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";

// CONFIG BUNNY
const STORAGE_NAME = "pierro-storage";
const STORAGE_URL = `https://storage.bunnycdn.com/${STORAGE_NAME}`;
const STORAGE_KEY = "c5dc0d4b-0100-473b-88729446369f-9a9a-40fc"; 

// ------------------------------
// CORS ALWAYS ENABLED
// ------------------------------
function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, AccessKey");
}

// ------------------------------
// BUNNY UPLOAD
// ------------------------------
async function uploadToBunny(fullPath, buffer) {
  const url = `${STORAGE_URL}/${fullPath}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "AccessKey": STORAGE_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: buffer
  });

  return response.ok;
}

// ------------------------------
// API HANDLER
// ------------------------------
export default async function handler(req, res) {
  setCORS(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Méthode non autorisée" });
  }

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

    const fileList = Array.isArray(files.files) ? files.files : [files.files];
    let uploadedFiles = [];

    for (const f of fileList) {
      const buffer = fs.readFileSync(f.filepath);
      const fullPath = `${basePath}/${f.originalFilename}`;
      const ok = await uploadToBunny(fullPath, buffer);
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
