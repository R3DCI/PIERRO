// ===============================
//      CONFIG PIN
// ===============================
const ADMIN_PIN = "0801";

// Sélecteurs
const pinInput = document.getElementById("pin");
const pinBtn = document.getElementById("pin-btn");
const adminContent = document.getElementById("admin-content");

// Au chargement : cacher le contenu admin
adminContent.style.display = "none";

// ===============================
//      Vérification du PIN
// ===============================
pinBtn.addEventListener("click", () => {
    const entered = pinInput.value.trim();

    if (entered === ADMIN_PIN) {
        adminContent.style.display = "block";   // on affiche l’admin
        document.getElementById("pin-zone").style.display = "none"; // on cache le formulaire PIN
    } else {
        alert("PIN incorrect ❌");
    }
});


// ===============================
//   (PLUS TARD) Upload visiteurs
// ===============================

// Ce bloc sera activé ensuite.
console.log("Admin ready ✔");
