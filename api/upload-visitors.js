import { NextResponse } from "next/server";
import crypto from "crypto";

// ========== CONFIG BUNNY ==========
const BUNNY_STORAGE_ZONE = "pierro-storage";
const BUNNY_API_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;
const BUNNY_API_KEY = "c5dc0d4b-0100-473b-88729446369f-9a9a-40fc"; // TA KEY

export const config = {
  api: {
    bodyParser: false
  }
};

// ========== HELPER : lire un form-data ==========
async function readFormData(req) {
  const chunks = [];
  for await (const chunk of req.body) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const boundary = req.headers
    .get("content-type")
    .split("boundary=")[1];

  const parts = buffer.toString("binary").split(`--${boundary}`);

  const fields = {};
  const files = [];

  for (let part of parts) {
    if (part.includes('Content-Disposition: form-data; name="')) {
      const name = part
        .match(/name="([^"]+)"/)?.[1];

      if (part.includes("filename=")) {
        const filename = part
          .match(/filename="([^"]+)"/)?.[1];

        const start = part.indexOf("\r\n\r\n") + 4;
        const end = part.lastIndexOf("\r\n");

        const fileBuffer = Buffer.from(
          part.substring(start, end),
          "binary"
        );

        files.push({
          name: filename,
          buffer: fileBuffer
        });
      } else {
        const value = part.split("\r\n\r\n")[1]?.split("\r\n")[0];
        fields[name] = value;
      }
    }
  }

  return { fields, files };
}

// ========== UPLOAD TO BUNNY ==========
async function bunnyUpload(path, buffer) {
  const url = `${BUNNY_API_URL}/${path}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/octet-stream"
    },
    body: buffer
  });

  if (!res.ok) {
    throw new Error(`Bunny upload failed: ${res.status}`);
  }
}

// ========== MAIN HANDLER ==========
export default async function handler(req) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { fields, files } = await readFormData(req);

    const name = fields.name?.trim();
    const message = fields.message?.trim();
    const year = fields.year?.trim();

    if (!name || !message || !year) {
      return NextResponse.json(
        { error: "Nom, message et année obligatoires." },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier reçu." },
        { status: 400 }
      );
    }

    // ID unique du post
    const postId = crypto.randomBytes(5).toString("hex");

    // Dossier : visitors/2025/uid_xxxx/
    const basePath = `visitors/${year}/${postId}`;

    // Upload des fichiers (photo / video)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${basePath}/file_${i + 1}_${file.name}`;
      await bunnyUpload(path, file.buffer);
    }

    // Création du META JSON
    const meta = {
      name,
      message,
      year,
      createdAt: Date.now(),
      files: files.map((f, i) => `file_${i + 1}_${f.name}`)
    };

    await bunnyUpload(
      `${basePath}/meta.json`,
      Buffer.from(JSON.stringify(meta, null, 2))
    );

    return NextResponse.json({
      success: true,
      postId,
      year,
      message: "Publication créée avec succès."
    });

  } catch (e) {
    console.error("UPLOAD VISITOR ERROR:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
