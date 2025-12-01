/* ===========================
   CONFIG BUNNY STORAGE
=========================== */

// CDN pour afficher
const STORAGE_CDN = "https://pierro-cdn.b-cdn.net";

// ENDPOINT API POUR TON STORAGE ZONE (IMPORTANT)
const STORAGE_API = "https://pierro-storage.storage.bunnycdn.com";

// Password = Clé API
const API_KEY = "e0d3b676-75f2-437c-a032ac4238e1-8325-48c1";

// Années fixes
const fixedYears = [2020, 2021, 2022, 2023, 2024, 2025];


/* ===========================
   TIMELINE
=========================== */

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
    const url = `${STORAGE_API}/${folderPath}/`;

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
    const mainVideoURL = `https://pierro-videos.b-cdn.net/videos/main/${selectedYear}.MP4`;
    document.getElementById("videoSource").src = mainVideoURL;
    document.getElementById("mainVideo").load();

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    // IMAGES
    const images = await listFilesAPI(`photos/${selectedYear}`);
    images.forEach(filename => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `<img src="${STORAGE_CDN}/photos/${selectedYear}/${filename}" />`;
        gallery.appendChild(div);
    });

    // VIDEOS UTILISATEURS
    const videos = await listFilesAPI(`videos/user/${selectedYear}`);
    videos.forEach(filename => {
        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
            <video controls>
                <source src="https://pierro-videos.b-cdn.net/videos/user/${selectedYear}/${filename}" type="video/mp4">
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
    const files = document.getElementById("fileInput").files;

    if (!year) return alert("Choisir une année.");
    if (!files.length) return alert("Choisir un fichier.");

    for (const file of files) {

        let uploadPath = file.type.startsWith("image")
            ? `photos/${year}/${file.name}`
            : file.type.startsWith("video")
                ? `videos/user/${year}/${file.name}`
                : null;

        if (!uploadPath) continue;

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


// START
loadGallery();
