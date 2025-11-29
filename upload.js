export default {
  async fetch(request, env) {

    // ============ UPLOAD (POST) ============
    if (request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        const year = formData.get("year");
        const name = formData.get("name") || "";
        const message = formData.get("message") || "";

        if (!file || !year) {
          return new Response("Fichier ou année manquants", { status: 400 });
        }

        // Dossier par année
        const extension = file.name.split(".").pop();
        const key = `${year}/${Date.now()}.${extension}`;

        // Upload vers R2
        await env.BUCKET.put(key, file.stream(), {
          httpMetadata: { contentType: file.type }
        });

        // URL publique
        const publicUrl = `https://pub-2977f39c3cc746c3b28e60884b62b9a4.r2.dev/${key}`;

        return Response.json({
          success: true,
          url: publicUrl,
          year,
          name,
          message,
          type: file.type.startsWith("video") ? "video" : "image",
          file: key
        });

      } catch (err) {
        return new Response("Erreur serveur : " + err, { status: 500 });
      }
    }

    // ============ LISTER TOUTES LES ANNÉES ============
    if (request.method === "GET") {
      const url = new URL(request.url);
      const year = url.searchParams.get("year");

      // Aucune année → renvoie la liste des dossiers (années)
      if (!year) {
        const list = await env.BUCKET.list({ delimiter: "/" });

        return Response.json({
          years: list.delimitedPrefixes.map(p => p.replace("/", ""))
        });
      }

      // ============ LISTER LES FICHIERS D’UNE ANNÉE ============
      const objects = await env.BUCKET.list({
        prefix: `${year}/`
      });

      const files = objects.objects.map(obj => ({
        file: obj.key,
        url: `https://${env.BUCKET.id}.r2.dev/${obj.key}`,
        type: obj.key.toLowerCase().endsWith(".mp4") ? "video" : "image"
      }));

      return Response.json({ year, files });
    }

    return new Response("Méthode non autorisée", { status: 405 });
  }
};
