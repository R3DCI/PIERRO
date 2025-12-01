/* ===========================
        CONFIG BUNNY STORAGE
=========================== */

// CDN pour les photos
const STORAGE_CDN = "https://pierro-cdn.b-cdn.net";

// CDN pour les vidéos
const VIDEO_CDN = "https://pierro-videos.b-cdn.net";

// API Bunny Storage
const STORAGE_API = "https://storage.bunnycdn.com/pierro-storage";

// NOUVEAU PASSWORD (clé API descendante)
const API_KEY = "c5dc0d4b-0100-473b-88729446369f-9a9a-40fc";


/* ===========================
          TIMELINE
=========================== */

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


/* ===========================
     LIST FILES (API STORAGE)
=========================== */

async function listFilesAPI(folderPath) {
    const url = `${STORAGE_API}/${folderPath}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "AccessKey": API_KEY
        }
    });

    if (!res.ok) return [];

    const files = await res.json();
    return files.items ? files.items.map(f => f.objectName) : [];
}


/* ===========================
          LOAD GALLERY
=========================== */

async function loadGallery(year = null) {
    const selectedYear = year || Math.max(...fixedYears);
    renderYearMenu(selectedYear);

    // VIDEO PRINCIPALE
    document.getElementById("videoSource").src =
        `${VIDEO_CDN}/videos/main/${selectedYear}.mp4`;
    document.getElementById("mainVideo").load();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    // IMAGES
    const images = await listFilesAPI(`photos/${selectedYear}`);
    images.forEach(filename => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
            <img src="${STORAGE_CDN}/photos/${selectedYear}/${filename}">
        `;
        gallery.appendChild(div);
    });

    // VIDEOS UTILISATEURS
    const videos = await listFilesAPI(`videos/user/${selectedYear}`);
    videos.forEach(filename => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
            <video controls>
                <source src="${VIDEO_CDN}/videos/user/${selectedYear}/${filename}" type="video/mp4">
            </video>
        `;
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
        let uploadPath = "";

        if (file.type.startsWith("image")) {
            uploadPath = `photos/${year}/${file.name}`;
        } else if (file.type.startsWith("video")) {
            uploadPath = `videos/user/${year}/${file.name}`;
        } else continue;

        await fetch(`${STORAGE_API}/${uploadPath}`, {
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
             START
=========================== */

loadGallery();
