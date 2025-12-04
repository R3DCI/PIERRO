/* ============================
      UPLOAD → BUNNY CDN
============================ */

async function uploadToBunny(file, fullPath) {
    const res = await fetch("/api/upload-visitors", {
        method: "POST",
        headers: { "x-file-path": fullPath },
        body: file
    });
    const data = await res.json();
    return data.url;
}


/* ============================
        CONFIG TIMELINE
============================ */

const fixedYears = [2020, 2021, 2022, 2023, 2024, 2025];

function renderYearMenu(active) {
    const box = document.getElementById("years-menu");
    box.innerHTML = "";

    fixedYears.forEach(y => {
        const el = document.createElement("div");
        el.className = "year-btn" + (y === active ? " active" : "");
        el.innerText = y;
        el.onclick = () => loadGallery(y);
        box.appendChild(el);
    });
}


/* ============================
     LIST FILES (BUNNY CDN)
============================ */

async function listBunnyFiles(prefix) {
    try {
        const res = await fetch(`https://pierro-storage.b-cdn.net/${prefix}`);
        if (!res.ok) return [];
        const html = await res.text();
        return [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    } catch {
        return [];
    }
}


/* ============================
         LOAD GALLERY
============================ */

async function loadGallery(year = null) {
    const selectedYear = year || Math.max(...fixedYears);
    renderYearMenu(selectedYear);

    const videoURL = `https://pierro-storage.b-cdn.net/videos/main/${selectedYear}.mp4`;
    document.getElementById("videoSource").src = videoURL;
    document.getElementById("mainVideo").load();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    const base = `videos/user/${selectedYear}/`;
    const folders = await listBunnyFiles(base);

    for (const folder of folders) {
        const id = folder.replace("/", "");
        const files = await listBunnyFiles(`${base}${id}/`);
        const div = document.createElement("div");
        div.className = "item";

        files.forEach(file => {
            const url = `https://pierro-storage.b-cdn.net/${base}${id}/${file}`;

            if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
                div.innerHTML += `<img src="${url}">`;
            } else if (file.match(/\.(mp4|mov|webm)$/i)) {
                div.innerHTML += `
                    <video controls>
                        <source src="${url}" type="video/mp4">
                    </video>`;
            }
        });

        gallery.appendChild(div);
    }
}


/* ============================
            UPLOAD
============================ */

async function uploadFiles() {
    const year = document.getElementById("yearInput").value;
    if (!year) return alert("Choisir une année.");

    const files = document.getElementById("fileInput").files;
    if (!files.length) return alert("Choisir un fichier.");

    for (const file of files) {
        const id = Date.now();
        const path = `videos/user/${year}/${id}/${file.name}`;
        await uploadToBunny(file, path);
    }

    closePopup();
    loadGallery();
}


/* ============================
            POPUP
============================ */

function openPopup() {
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}


/* ============================
            START
============================ */

loadGallery();
