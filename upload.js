/* ===========================
      CONFIG VERCEL BLOB
=========================== */

async function uploadToBlob(file, year) {
    const filename = `${year}/${Date.now()}-${file.name}`;
    
    const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
            "x-file-name": filename
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
       LIST FILES BLOB API
=========================== */

async function listBlobFiles(prefix) {
    const url = `/api/list?prefix=${encodeURIComponent(prefix)}`;

    const res = await fetch(url);
    if (!res.ok) return [];

    return await res.json();
}


/* ===========================
          LOAD GALLERY
=========================== */

async function loadGallery(year = null) {
    const selectedYear = year || Math.max(...fixedYears);
    renderYearMenu(selectedYear);

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    /* ====== PHOTO & VIDEO LISTE ====== */

    const allFiles = await listBlobFiles(`${selectedYear}/`);

    allFiles.forEach(url => {
        const div = document.createElement("div");
        div.className = "item";

        if (url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
            div.innerHTML = `<img src="${url}" />`;
        } else if (url.match(/\.(mp4|mov|webm|mkv)$/i)) {
            div.innerHTML = `
                <video controls>
                    <source src="${url}" type="video/mp4" />
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
        await uploadToBlob(file, year);
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
