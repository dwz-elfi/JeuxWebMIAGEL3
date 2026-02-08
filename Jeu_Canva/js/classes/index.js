import { choixJeu, casesChoix, zoneJeu } from "./ecouteurs_centralise.js";

const canvas = document.getElementById("zoneJeu");
const ctx = canvas.getContext("2d");

const imgMenu = new Image();
imgMenu.src = "assets/Swords_Bravery.png";

const imgPersonnage = new Image();
imgPersonnage.src = "assets/Personnage.png";

let gameState = "MENU";

choixJeu.forEach((carre) => {
    carre.addEventListener("click", () => {
        const choixId = carre.id;
        console.log("Choix sélectionné :", choixId);

        // Cache tous les carrés
        casesChoix.classList.remove("visible");

        // Logique selon le choix
        if (choixId === "choix1") {
            gameState = "COMBAT";
            console.log("Lancement du mini-jeu Combat");
        }
        if (choixId === "choix2") {
            gameState = "DEFENSE";
            console.log("Lancement du mini-jeu Défense");
        }
        if (choixId === "choix3") {
            gameState = "ARCHERIE";
            console.log("Lancement du mini-jeu Archerie");
        }
    });
});



