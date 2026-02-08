import {ecouterEvenements} from "./evenements.js";

const canvas = document.getElementById("zoneJeu");
const ctx = canvas.getContext("2d");

const imgMenu = new Image();
imgMenu.src = "assets/Swords_Bravery.png";

const imgPersonnage = new Image();
imgPersonnage.src = "assets/Personnage.png";

let gameState = "MENU";



