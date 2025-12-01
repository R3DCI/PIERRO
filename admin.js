// =======================================================
//               PANEL ADMIN — UPLOAD PRINCIPAL
//         Compatible fichiers jusqu'à 5 Go (OK BunnyCDN)
// =======================================================

// Sélecteurs DOM
const uploadMainBtn = document.getElementById("upload-main-btn");
const mainYearSelect = document.getElementById("mainYear");
const mainFileInput = document.getElementById("mainFile");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");


// =======================================================
//      FONCTION : Upload Principal (via /api/upload-main)
// =======================================================

async function uploadMainVideo() {
    const year = mainYearSelect.value;
    const file = mainFileInput.files[0];

    if (!year) return alert("Sélectionne une année.");
    if (!file) return alert("Sélectionne une vidéo.");

    // Reset affichage
    progressText.innerText = "0%";
    progressBar.style.width = "0%";

    // Appel au endpoint Node pour l’upload en chunks
    const url = `/api/upload-main?year=${year}`;

    // Upload fetch → on stream le fichier au backend
    const response = await fetch(url, {
        method: "POST",
        body: file
    });

    const result = await response.json();

    if (!response.ok) {
        console.error("Erreur upload :", result);
        alert("Erreur pendant l'envoi.");
        return;
    }

    alert("Vidéo principale uploadée avec succès !");
}


// =======================================================
//        GESTION DE LA BARRE DE PROGRESSION LOCALE
//       (simulation car chunk fait côté serveur)
// =======================================================
//
// ⚠️ Note : Avec Bunny, le réel progrès serveur n’est
//           pas renvoyé chunk par chunk → on simule la
//           progression locale pendant l'envoi,
//           ce qui est acceptable et courant.
//
// =======================================================

mainFileInput.addEventListener("change", () => {
    const file = mainFileInput.files[0];
    if (!file) return;

    progressText.innerText = "0%";
    progressBar.style.width = "0%";
});

uploadMainBtn.addEventListener("click", async () => {
    const file = mainFileInput.files[0];
    if (!file) return uploadMainVideo();

    // Simulation progrès locale pendant envoi
    let sent = 0;
    const total = file.size;
    const step = Math.max(500_000, total / 120); // 500 kb min + rythme ajusté

    const interval = setInterval(() => {
        sent += step;
        let percent = Math.min(100, Math.floor((sent / total) * 100));
        progressText.innerText = percent + "%";
        progressBar.style.width = percent + "%";

        if (percent >= 100) clearInterval(interval);
    }, 120);

    // Lancer l'upload réel
    await uploadMainVideo();
});


// =======================================================
//      FUTURE : Upload visiteurs (à activer après)
// =======================================================

/*

Ici tu ajouteras upload-visiteurs.js
qui utilisera la même logique bunny CDN.

Je suis prêt à te le faire dès que tu me dis :
"ENVOIE upload-visiteurs.js"

*/

// FIN.
