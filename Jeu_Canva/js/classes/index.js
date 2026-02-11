import { choixJeu, casesChoix, zoneJeu, btnPlay } from "./ecouteurs_centralise.js";

const canvas = document.getElementById("zoneJeu");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;

// Taille fenetre de jeu (support HiDPI)
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

//Hover des boutons de choix
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

function isInside(pos, btn) {
    return pos.x > btn.x && pos.x < btn.x + btn.w && 
           pos.y > btn.y && pos.y < btn.y + btn.h;
}

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left-13, y: e.clientY - rect.top+14 };
    const pos2 = { x: e.clientX - rect.left-50, y: e.clientY+2 - rect.top };
    if (gameState === "MENU" && isInside(pos, playBtn)) {
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
    if (gameState === 'MENU' && isInside(pos, playBtn)) hoveredItem = pos;
    if (gameState === 'CHOIX'){
        choix.forEach(item => { 
            if(isInside(pos2, item)) hoveredItem = item; });
    }
    if(hoveredItem) {
        canvas.style.cursor = "pointer";
    } else {
        canvas.style.cursor = "default";
    }
});


// Définition des boutons de choix
let choix = [
    { label: "Combat", x: 150, y: 275, w: 100, h: 100, color: "rgb(218,206,147)" },
    { label: "Defense", x: 300, y: 275, w: 100, h: 100, color: "rgb(218,206,147)" },
    { label: "Archerie", x: 450, y: 275, w: 100, h: 100, color: "rgb(218,206,147)" }
];


function drawChoix() {
    // On dessine le fond de jeu derrière
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
    ctx.save();
    drawMenu();
    ctx.restore();
}

function drawDefense() {
    ctx.save();
    drawChoix();
    ctx.restore();
}

function drawArcherie() {
    ctx.save();
    drawMenu();
    ctx.restore();
}

function draw() {
    ctx.save();

    if (gameState === "MENU") {
        drawMenu();
    }
    if (gameState === "CHOIX") {
        drawChoix(); 
    } 
    if (gameState === "COMBAT") {
        drawCombat();
    }
    if (gameState === "DEFENSE") {
        drawDefense();
    }
    if (gameState === "ARCHERIE") {
        drawArcherie();
    }
    ctx.restore();
}

function Gameloop() {
    draw();
    requestAnimationFrame(Gameloop);
}

Gameloop();
   

