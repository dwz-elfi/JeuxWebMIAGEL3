const btnPlay = document.getElementById("btnPlay");
const zoneJeu = document.getElementById("zoneJeu");
const casesChoix = document.getElementById("choix_mini-jeux");
const choixJeu = document.querySelectorAll(".choixJeu");

btnPlay.addEventListener("click", () => {
    zoneJeu.style.backgroundImage = 'url("./assets/fond_jeu.png")';
    btnPlay.style.display = "none";

    //Permet de voir les cases des mini-jeux après avoir cliqué sur Play (Transition)
    casesChoix.classList.add("visible");
});

choixJeu.forEach((carre) => {
    carre.addEventListener("click", () => {
        const choixId = carre.id;
        console.log("Choix sélectionné :", choixId);

        // Cache tous les carrés
        casesChoix.classList.remove("visible");

        // Tu peux ajouter ici la logique selon le choix
        // if (choixId === "choix1") { ... }
        // if (choixId === "choix2") { ... }
        // if (choixId === "choix3") { ... }
    });
});

export { choixJeu, casesChoix, zoneJeu };