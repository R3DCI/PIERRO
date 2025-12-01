/* ===========================
   CONFIG BUNNY STORAGE (FINAL)
=========================== */

// CDN public
const STORAGE_CDN = "https://pierro-storage.b-cdn.net";

// Endpoint upload (PUT)
const STORAGE_UPLOAD = "https://storage.bunnycdn.com/pierro-storage";

// CLÉ D’ÉCRITURE BUNNY STORAGE (mettre le PASSWORD ici)
const API_KEY = "e8637941-78b4-4064-b07bfd35385a-b1c2-4aaa";

// ANNÉES FIXES
const fixedYears = [2020,2021,2022,2023,2024,2025];

/* ===========================
    LISTAGE DES FICHIERS
=========================== */

async function listFiles(path) {
    try {
        const res = await fetch(`${STORAGE_CDN}/${path}/`);
        const text = await res.text();

        return [...text.matchAll(/href="([^"]+)"/g)]
            .map(m => m[1])
            .filter(name => name !== "../");
    } catch (e) {
        return [];
    }
}

/* ===========================
    AFFICHAGE GALLERIE
=========================== */

async function loadGallery(year = null) {

    const selectedYear = year || Math.max(...fixedYears);

    /* Vidéo principale */
    const videoURL = `https://pierro-videos.b-cdn.net/videos/main/${selectedYear}.MP4`;
    document.getElementById("videoSource").src = videoURL;
    document.getElementById("mainVideo").load();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    /* IMAGES */
    const images = await listFiles(`photos/${selectedYear}`);

    images.forEach(filename => {
        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
            <img src="${STORAGE_CDN}/photos/${selectedYear}/${filename}">
        `;

        gallery.appendChild(div);
    });

    /* VIDÉOS UTILISATEUR */
    const videos = await listFiles(`videos/user/${selectedYear}`);

    videos.forEach(filename => {
        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
            <video controls>
                <source src="${STORAGE_CDN}/videos/user/${selectedYear}/${filename}" type="video/mp4">
            </video>
        `;

        gallery.appendChild(div);
    });
}

/* ===========================
    UPLOAD FICHIERS
=========================== */

async function uploadFiles() {
    const year = document.getElementById("yearInput").value;
    if (!year) return alert("Choisir une année.");

    const files = document.getElementById("fileInput").files;
    if (!files.length) return alert("Choisir un fichier.");

    for (const file of files) {

        let uploadPath = "";

        if (file.type.startsWith("image")) {
            uploadPath = `photos/${year}/${file.name}`;
        } 
        else if (file.type.startsWith("video")) {
            uploadPath = `videos/user/${year}/${file.name}`;
        } 
        else {
            continue;
        }

        await fetch(`${STORAGE_UPLOAD}/${uploadPath}`, {
            method: "PUT",
            headers: {
                "AccessKey": API_KEY,
                "Content-Type": file.type
            },
            body: file
        });
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
    INIT
=========================== */
loadGallery();
