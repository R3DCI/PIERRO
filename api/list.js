// =======================================
//      API LIST → BUNNY STORAGE
//   Liste les posts visiteurs par année
// =======================================

export const config = {
  api: { bodyParser: false },
};

const STORAGE_NAME = "pierro-storage";
const STORAGE_URL = `https://storage.bunnycdn.com/${STORAGE_NAME}`;
const STORAGE_KEY = "c5dc0d4b-0100-473b-88729446369f-9a9a-40fc"; // clé descendante Bunny

// ------------------------------
//  LISTER LES OBJETS BUNNY
// ------------------------------
async function listObjects(prefix) {
  const res = await fetch(`${STORAGE_URL}/${prefix}`, {
    method: "GET",
    headers: {
      AccessKey: STORAGE_KEY,
    },
  });

  if (!res.ok) return [];

  const data = await res.json();

  return data;
}

// ------------------------------
//    HANDLER PRINCIPAL
// ------------------------------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET")
    return res.status(405).json({ success: false, error: "Méthode non autorisée" });

  const year = req.query.year;

  if (!year)
    return res.status(400).json({ success: false, error: "Année manquante" });

  // Dossier pour cette année
  const base = `videos/user/${year}`;

  // Liste des dossiers (un dossier = un post)
  const yearFolders = await listObjects(base);

  if (!Array.isArray(yearFolders))
    return res.status(200).json({ success: true, posts: [] });

  const posts = [];

  for (const folder of yearFolders) {
    if (!folder.ObjectName || folder.ObjectName === "" || !folder.IsDirectory)
      continue;

    const id = folder.ObjectName.replace("/", "");
    const postPath = `${base}/${id}`;

    // On liste le contenu du dossier du post
    const files = await listObjects(postPath);

    if (!Array.isArray(files)) continue;

    const fileNames = files
      .filter(f => !f.IsDirectory)
      .map(f => f.ObjectName.split("/").pop());

    // On cherche meta.json
    const metaFile = files.find(f => f.ObjectName.endsWith("meta.json"));

    let meta = null;

    if (metaFile) {
      const metaRes = await fetch(
        `${STORAGE_URL}/${metaFile.ObjectName}`,
        {
          method: "GET",
          headers: { AccessKey: STORAGE_KEY }
        }
      );

      if (metaRes.ok) meta = await metaRes.json();
    }

    posts.push({
      id,
      meta,
      files: fileNames
    });
  }

  return res.status(200).json({
    success: true,
    year,
    posts
  });
}
