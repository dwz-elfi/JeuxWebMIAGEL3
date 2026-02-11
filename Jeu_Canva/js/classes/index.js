import Player from "./player.js";
import { defineListeners, inputStates } from "./ecouteurs.js";

const canvas = document.getElementById("zoneJeu");
const ctx = canvas.getContext("2d");

let player = new Player(425, 325, 50, 50);

const width = 850;
const height = 650;

const imgMenu = new Image();
imgMenu.src = "assets/Swords_Bravery.png";
const fond = new Image();
fond.src = "assets/fond_jeu.png";

//Etat du jeu de base
let gameState = "MENU";
//Taille/ position du bouton play
let playBtn = {x:canvas.width/2-100, y:canvas.height/2-25, w:200, h:50};

let hoveredItem = null;


function drawMenu(){
    ctx.drawImage(imgMenu, 0, 0, canvas.width, canvas.height);
    ctx.save();
    
    //Stylisme du bouton
    ctx.fillStyle = "rgb(218,206,147)";
    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    
    ctx.fillText("- PLAY - ", playBtn.x + playBtn.w/2+20, playBtn.y + playBtn.h/2);
    ctx.restore();
}

function isInside(pos, pos2) {
    return pos.x > pos2.x && pos.x < pos2.x + pos2.w && pos.y > pos2.y && pos.y < pos2.y + pos2.h;
}

//Choix des jeux dispo
let choix = [
    { label: "Combat", x: 150, y: 275, w: 100, h: 100, color: "rgb(218,206,147)" },
    { label: "Defense", x: 300, y: 275, w: 100, h: 100, color: "rgb(218,206,147)" },
    { label: "Archerie", x: 450, y: 275, w: 100, h: 100, color: "rgb(218,206,147)" }
];

function drawChoix() {
    ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.textAlign = "center";
    ctx.font = "20px sans-serif";

    choix.forEach(item => {
        // Dessin du rectangle
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x+50, item.y, item.w, item.h);
        
        // Dessin du texte
        ctx.fillStyle = "white";
        ctx.fillText(item.label, item.x + item.w/2 + 50, item.y + item.h/2 + 10);
    });
    ctx.restore();
}


function drawCombat() {
    ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    ctx.save();
    drawPlayer();
    ctx.restore();
}

function drawDefense() {
    ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    ctx.save();
    drawChoix();
    ctx.restore();
}

function drawArcherie() {
    ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    ctx.save();
    drawChoix();
    ctx.restore();
}

function drawPlayer() {
    player.draw(ctx);
}

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left-13, y: e.clientY - rect.top+14 };
    const pos2 = { x: e.clientX - rect.left-50, y: e.clientY+2 - rect.top };
    if (gameState === "MENU" && isInside(pos, playBtn)) {
        console.log("bouton play cliqué");
        gameState = "CHOIX";
        return;
    }
    if (gameState === "CHOIX" ) {
        choix.forEach(item => {
            if (isInside(pos2, item)) {
                console.log("Choix : " + item.label);
                if (item.label === "Combat") {
                    gameState = "COMBAT";
                }
                if (item.label === "Defense") {
                    gameState = "DEFENSE";
                }
                if (item.label === "Archerie") {
                    gameState = "ARCHERIE";
                }
            }
        });
    }
    if(hoveredItem) {
        canvas.style.cursor = "pointer";
    } else {
        canvas.style.cursor = "default";
    }
});


canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left-13, y: e.clientY - rect.top+14 };
    const pos2 = { x: e.clientX - rect.left-50, y: e.clientY+2 - rect.top };
    hoveredItem = null;
    if (gameState === 'MENU' && isInside(pos, playBtn)) {
        hoveredItem = pos;
    }
    if (gameState === 'CHOIX'){
        choix.forEach(item => { 
            if(isInside(pos2, item)) {
                hoveredItem = item; 
            }
        });
    }
    if(hoveredItem) {
        canvas.style.cursor = "pointer";
    } else {
        canvas.style.cursor = "default";
    }
});

function attaqueJoueur() {
    if (inputStates.left) {
       ctx.beginPath(); 
    }
    if (inputStates.right) {
        
    }
    if (inputStates.up) {
        
    }
    if (inputStates.down) {
        
    }
}

function Gameloop() {
    // 1 - on efface le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2 - on dessine tous les objets du jeu en fonction de l'état du jeu
    if (gameState === "MENU") {
        drawMenu();
    } else if (gameState === "CHOIX") {
        drawChoix();
    } else if (gameState === "COMBAT") {
        drawCombat();
        attaqueJoueur();
    } else if (gameState === "DEFENSE") {
        drawDefense();
    } else if (gameState === "ARCHERIE") {
        drawArcherie();
    }

    defineListeners();

    requestAnimationFrame(Gameloop);
}


Gameloop();
   

