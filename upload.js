/* ============================================
      UPLOAD ADMIN → BUNNY VIA VERCEL
============================================ */

const API = "https://pierro.vercel.app/api";

// Envoie un fichier vers BunnyCDN via ton API Vercel
async function uploadToBunny(file, fullPath) {
    const form = new FormData();
    form.append("file", file);
    form.append("path", fullPath);

    try {
        const res = await fetch(`${API}/upload-visitors`, {
            method: "POST",
            body: form
        });

        const json = await res.json();
        return json.success;

    } catch (e) {
        console.error("Erreur upload Bunny :", e);
        return false;
    }
}


/* ============================================
                 UPLOAD MULTIPLE
============================================ */

async function uploadFiles() {
    const year = document.getElementById("yearInput").value;
    const files = document.getElementById("fileInput").files;

    if (!year) return alert("Choisir une année.");
    if (!files.length) return alert("Choisir un fichier.");

    for (const f of files) {
        const id = Date.now();
        const path = `videos/user/${year}/${id}/${f.name}`;
        await uploadToBunny(f, path);
    }

    alert("Upload terminé !");
}
