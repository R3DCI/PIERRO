export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  try {
    const sessionId = req.headers["upload-id"];
    const index = req.headers["chunk-index"];
    const year = req.headers["upload-year"];
    const filename = req.headers["upload-filename"];
    const chunkSize = req.headers["chunk-size"];

    if (!sessionId || !index || !year || !filename) {
      return res.status(400).json({ error: "Missing upload headers" });
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const storagePassword = "c5dc0d4b-0100-473b-88729446369f-9a9a-40fc";

    const bunnyResponse = await fetch(
      `https://storage.bunnycdn.com/pierro-storage/videos/main/${year}/${filename}`,
      {
        method: "PUT",
        headers: {
          AccessKey: storagePassword,
          "Upload-Id": sessionId,
          "Chunk-Index": index,
          "Content-Length": buffer.length
        },
        body: buffer
      }
    );

    if (!bunnyResponse.ok) {
      return res.status(500).json({ error: "Chunk upload failed" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("CHUNK ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
