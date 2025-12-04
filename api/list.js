// =====================================================
//   LISTE DES POSTS PAR ANNÉE (pour le front)
//   API → https://pierro.vercel.app/api/list?year=2025
// =====================================================

export default async function handler(req, res) {
  const year = req.query.year;

  if (!year)
    return res.status(400).json({ success: false, error: "Année manquante" });

  const prefix = `https://pierro-storage.b-cdn.net/videos/user/${year}/`;

  try {
    const html = await fetch(prefix).then(r => r.text());

    const folders = [...html.matchAll(/href="([^"]+)\/"/g)]
      .map(m => m[1])
      .filter(f => f !== ".." && f !== "");

    return res.status(200).json({
      success: true,
      year,
      folders
    });

  } catch (e) {
    return res.status(500).json({ success: false, error: "Impossible de lister" });
  }
}
