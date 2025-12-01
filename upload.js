/* ===========================
   CONFIG BUNNY STORAGE
=========================== */

// CDN pour AFFICHER les photos
const STORAGE_CDN = "https://pierro-cdn.b-cdn.net";

// CDN pour AFFICHER les vidéos
const VIDEO_CDN = "https://pierro-videos.b-cdn.net";

// Storage origin pour LISTER & UPLOAD via API
const STORAGE_API = "https://storage.bunnycdn.com/pierro-storage";

// Clé API (lecture + écriture)
const API_KEY = "e0d3b676-75f2-437c-a032ac4238e1-8325-48c1"; 


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

    return files.items
        ? files.items.map(f => f.objectName)
        : [];
}


/* ===========================
   LOAD GALLERY
=========================== */

async function loadGallery(year = null) {
    const selectedYear = year || Math.max(...fixedYears);
    renderYearMenu(selectedYear);

    /* ========== MAIN VIDEO ========== */
    const mainVideoURL = `${VIDEO_CDN}/videos/main/${selectedYear}.MP4`;
    document.getElementById("videoSource").src = mainVideoURL;
    document.getElementById("mainVideo").load();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    /* ========== IMAGES ========== */
    const images = await listFilesAPI(`photos/${selectedYear}`);

    images.forEach(filename => {
        gallery.innerHTML += `
            <div class="item">
                <img src="${STORAGE_CDN}/photos/${selectedYear}/${filename}" />
            </div>
        `;
    });

    /* ========== VIDEOS UTILISATEURS ========== */
    const videos = await listFilesAPI(`videos/user/${selectedYear}`);

    videos.forEach(filename => {
        gallery.innerHTML += `
            <div class="item">
                <video controls>
                    <source src="${VIDEO_CDN}/videos/user/${selectedYear}/${filename}" type="video/mp4">
                </video>
            </div>
        `;
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
        } else {
            continue;
        }

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
