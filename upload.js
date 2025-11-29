export default {
  async fetch(request, env) {
    // Autoriser uniquement POST
    if (request.method !== "POST") {
      return new Response("Méthode non autorisée", { status: 405 });
    }

    try {
      // Récupère le FormData envoyé depuis ton site
      const formData = await request.formData();
      const file = formData.get("file");
      const year = formData.get("year");
      const name = formData.get("name") || "";
      const message = formData.get("message") || "";

      if (!file || !year) {
        return new Response("Fichier ou année manquants", { status: 400 });
      }

      // Générer un nom unique
      const extension = file.name.split(".").pop();
      const key = `${Date.now()}.${extension}`;

      // Upload vers R2
      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type }
      });

      // URL publique R2
      const publicUrl = `https://pub-${env.BUCKET.id}.r2.dev/${key}`;

      // Réponse JSON
      return new Response(
        JSON.stringify({
          url: publicUrl,
          year,
          name,
          message,
          type: file.type.startsWith("video") ? "video" : "image"
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      );

    } catch (err) {
      return new Response("Erreur serveur : " + err.toString(), { status: 500 });
    }
  }
};
