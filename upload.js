/* ============================
      UPLOAD → BUNNY (admin)
============================ */

async function uploadToBunny(file, fullPath) {
    const form = new FormData();
    form.append("files", file);
    form.append("year", document.getElementById("yearInput").value);
    form.append("name", "Admin");
    form.append("message", "Upload direct admin");

    const res = await fetch("/api/upload-visitors", {
        method: "POST",
        body: form
    });

    const json = await res.json();
    return json.success;
}

/* ============================
            GALLERY
============================ */

async function loadGallery(year = null) {
    year = year || new Date().getFullYear();

    const res = await fetch(`/api/list?year=${year}`);
    const json = await res.json();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    if (!json.success || json.posts.length === 0) {
        gallery.innerHTML = "Aucun fichier.";
        return;
    }

    json.posts.forEach(post => {
        if (!post.meta) return;

        const div = document.createElement("div");
        div.className = "item";

        post.files.forEach(f => {
            if (f === "meta.json") return;

            const url = `https://pierro-storage.b-cdn.net/videos/user/${year}/${post.id}/${f}`;

            if (f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".jpeg") || f.endsWith(".webp")) {
                div.innerHTML += `<img src="${url}" />`;
            } else if (f.endsWith(".mp4") || f.endsWith(".webm")) {
                div.innerHTML += `<video controls src="${url}"></video>`;
            }
        });

        gallery.appendChild(div);
    });
}

/* ============================
            START
============================ */

loadGallery();
