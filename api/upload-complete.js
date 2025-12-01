export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { sessionId, year, filename } = req.body;

    if (!sessionId || !year || !filename) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const storagePassword = "c5dc0d4b-0100-473b-88729446369f-9a9a-40fc";

    const bunnyResponse = await fetch(
      `https://storage.bunnycdn.com/pierro-storage/videos/main/${year}/${filename}`,
      {
        method: "PUT",
        headers: {
          AccessKey: storagePassword,
          "Upload-Id": sessionId,
          "Upload-Session": "finish"
        }
      }
    );

    if (!bunnyResponse.ok) {
      return res.status(500).json({ error: "Cannot finish upload" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("COMPLETE ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
