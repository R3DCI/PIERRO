/* ===========================
   CONFIG BUNNY STORAGE / STREAM
=========================== */

const STORAGE_URL = "https://pierro-souvenirs.b-cdn.net";
const STORAGE_UPLOAD = "https://storage.bunnycdn.com/pierro-souvenirs";

const STREAM_LIBRARY_ID = "552202";
const STREAM_API_KEY = "7397ef3d-1c52-43d4-95754d8feaf5-32c4-45ba";
const STREAM_PULL = "https://vz-552202-b92.b-cdn.net";

const fixedYears = [2020,2021,2022,2023,2024,2025];

/* ========== TIMELINE ========== */
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

/* ========== GET STREAM VIDEOS (Bunny Stream) ========== */
async function getStreamVideos() {
    const res = await fetch(
        `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`,
        { headers: { "AccessKey": STREAM_API_KEY } }
    );
    const data = await res.json();
    return data.items || [];
}

/* ========== GET STORAGE FILES (images only) ========== */
async function getStorageImages(year) {
    const res = await fetch(`${STORAGE_URL}/${year}/`);
    const data = await res.text();

    const matches = [...data.matchAll(/href="([^"]+)"/g)];

    return matches
        .map(m => m[1])
        .filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i))
        .map(f => ({
            url: `${STORAGE_URL}/${year}/${f}`,
            type: "image"
        }));
}

/* ========== LOAD GALLERY ========== */
async function loadGallery(selected = null) {
    const year = selected || Math.max(...fixedYears);
    renderYearMenu(year);

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    /* ===== VIDEO PRINCIPALE STREAM ===== */
    const allVideos = await getStreamVideos();
    const main = allVideos.find(v => v.meta?.year == year && v.meta?.type === "main");

    const mainVideoElement = document.querySelector(".main-video source");

    if (main) {
        mainVideoElement.src = `${STREAM_PULL}/${main.guid}/playlist.m3u8`;
    } else {
        mainVideoElement.src = "";
    }

    document.querySelector(".main-video").load();

    /* ===== PHOTOS Storage ===== */
    const images = await getStorageImages(year);

    images.forEach(item => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `<img src="${item.url}" />`;
        gallery.appendChild(div);
    });

    /* ===== VIDEOS Stream (autres que main) ===== */
    allVideos
        .filter(v => v.meta?.year == year && v.meta?.type !== "main")
        .forEach(v => {
            const div = document.createElement("div");
            div.className = "item";
            const videoURL = `${STREAM_PULL}/${v.guid}/playlist.m3u8`;

            div.innerHTML = `
                <video controls>
                    <source src="${videoURL}" type="application/x-mpegURL">
                </video>
            `;

            gallery.appendChild(div);
        });
}

/* ========== UPLOAD (IMAGE = STORAGE / VIDEO = STREAM) ========== */
async function uploadFiles() {
    const year = document.getElementById("yearInput").value;
    if (!year) return alert("Choisir une année.");

    const files = document.getElementById("fileInput").files;
    if (!files.length) return alert("Choisir un fichier.");

    for (const file of files) {

        if (file.type.startsWith("image")) {
            /* ==== UPLOAD IMAGE → STORAGE ==== */
            await fetch(`${STORAGE_UPLOAD}/${year}/${file.name}`, {
                method: "PUT",
                headers: { "AccessKey": STREAM_API_KEY },
                body: file
            });
        }

        if (file.type.startsWith("video")) {
            /* ==== UPLOAD VIDEO → STREAM ==== */
            const createRes = await fetch(
                `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`,
                {
                    method: "POST",
                    headers: {
                        "AccessKey": STREAM_API_KEY,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: file.name,
                        meta: { year: year, type: "user" }
                    })
                }
            );

            const video = await createRes.json();

            await fetch(
                `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${video.guid}`,
                {
                    method: "PUT",
                    headers: { "AccessKey": STREAM_API_KEY, "Content-Type": file.type },
                    body: file
                }
            );
        }
    }

    closePopup();
    loadGallery();
}

/* POPUP */
function openPopup() {
    document.getElementById("popup").style.display = "flex";
}
function closePopup() {
    document.getElementById("popup").style.display = "none";
}

/* START */
loadGallery();
