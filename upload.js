/* ===========================
      CONFIG VERCEL BLOB
=========================== */

async function uploadToBlob(file, fullPath) {
    const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
            "x-file-name": fullPath
        },
        body: file
    });

    const data = await res.json();
    return data.url;
}


/* ===========================
        CONFIG TIMELINE
=========================== */

const fixedYears = [2020, 2021, 2022, 2023, 2024, 2025];

function renderYearMenu(active) {
    const box = document.getElementById("years-menu");
    box.innerHTML = "";

    fixedYears.forEach(y => {
        const el = document.createElement("div");
        el.className = "year-btn" + (y === active ? "active" : "");
        el.innerText = y;
        el.onclick = () => loadGallery(y);
        box.appendChild(el);
    });
}


/* ===========================
     LIST FILES (Vercel Blob)
=========================== */

async function listBlobFiles(prefix) {
    const res = await fetch(`/api/list?prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) return [];
    return await res.json();
}


/* ===========================
          LOAD GALLERY
=========================== */

async function loadGallery(year = null) {
    const selectedYear = year || Math.max(...fixedYears);
    renderYearMenu(selectedYear);

    /* ===============================
           VIDÉO PRINCIPALE
       =============================== */

    const mainVideoURL = `https://blob.vercel-storage.com/main/${selectedYear}.mp4`;

    document.getElementById("videoSource").src = mainVideoURL;
    document.getElementById("mainVideo").load();

    /* ===============================
           GALERIE DES VISITEURS
       =============================== */

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    const files = await listBlobFiles(`${selectedYear}/`);

    files.forEach(url => {
        const div = document.createElement("div");
        div.className = "item";

        if (url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
            div.innerHTML = `<img src="${url}">`;
        }
        else if (url.match(/\.(mp4|mov|webm|mkv)$/i)) {
            div.innerHTML = `
                <video controls>
                    <source src="${url}" type="video/mp4">
                </video>
            `;
        }

        gallery.appendChild(div);
    });
}


/* ===========================
             UPLOAD
=========================== */

async function uploadFiles() {
    const year = document.getElementById("yearInput").value;
    if (!year) return alert("Choisir une année.");

    const files = document.getElementById("fileInput").files;
    if (!files.length) return alert("Choisir un fichier.");

    for (const file of files) {
        const path = `${year}/${Date.now()}-${file.name}`;
        await uploadToBlob(file, path);
    }

    closePopup();
    loadGallery();
}


/* ===========================
             POPUP
=========================== */

function openPopup() {
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}


/* ===========================
             START
=========================== */

loadGallery();
