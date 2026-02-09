// Expose DOM elements only; canvas code will handle interactions
const btnPlay = document.getElementById("btnPlay");
const zoneJeu = document.getElementById("zoneJeu");
const casesChoix = document.getElementById("choix_mini-jeux");
const choixJeu = document.querySelectorAll(".choixJeu");

export { choixJeu, casesChoix, zoneJeu, btnPlay };
