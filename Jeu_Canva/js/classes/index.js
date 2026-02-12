import Player from "./player.js";
import { defineListeners, inputStates } from "./ecouteurs_centralise.js";
import { circRectsOverlap } from "./collision.js";
import { SlashAnimation, SlashSound } from "./animation.js";

const canvas = document.getElementById("zoneJeu");
const ctx = canvas.getContext("2d");

let player = new Player(425, 325, 50, 50);

const width = 850;
const height = 650;

const imgMenu = new Image();
imgMenu.src = "assets/Swords_Bravery.png";
const fond = new Image();
fond.src = "assets/fond_jeu.png";

const epee = new Image();
epee.src = "assets/epee.png";

const star = new Image();
star.src = "assets/star.png";

const pomme = new Image();
pomme.src = "assets/Pomme.png";

// Gestion des étoiles (stars)
let stars = [];
let lastStarTime = Date.now();
let nextStarInterval = Math.random() * (3000 - 2000) + 2000; // 2-7 secondes

// Cooldown de l'épée
let lastAttackTime = 0;
const attackCooldown = 250  ; // Durée d'affichage de l'épée en millisecondes

// Animations et sons
let slashAnimations = [];
let slashSound = new SlashSound("assets/slash.mp3");

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
    updateStars();
    
    // Dessiner et mettre à jour les animations de slash
    for (let i = slashAnimations.length - 1; i >= 0; i--) {
        slashAnimations[i].draw(ctx, canvas);
        if (slashAnimations[i].isFinished) {
            slashAnimations.splice(i, 1);
        }
    }
    
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

function updateStars() {
    let now = Date.now();
    
    // Créer une nouvelle étoile si l'intervalle est écoulé
    if (now - lastStarTime > nextStarInterval) {
        let newStar = {
            x: 55,
            y: -30,
            width: 30,
            height: 30,
            speed: Math.random() * 4 + 1 // Vitesse aléatoire 1-3 px/frame
        };
        stars.push(newStar);
        lastStarTime = now;
        nextStarInterval = Math.random() * (7000 - 2000) + 2000; // Nouvel intervalle aléatoire
    }
    
    // Mettre à jour et dessiner les étoiles
    for (let i = stars.length - 1; i >= 0; i--) {
        let s = stars[i];
        s.y += s.speed; // Faire tomber l'étoile
        
        // Dessiner l'étoile
        ctx.drawImage(star, s.x, s.y, s.width, s.height);
        
        // Vérifier collision avec l'épée du côté gauche seulement
        if (inputStates.left) {
            if (circRectsOverlap(80, 360, 10, 70, s.x + s.width/2, s.y + s.height/2, 15)) {
                stars.splice(i, 1);
                continue;
            }
        }
        
        // Supprimer les étoiles qui sortent du bas
        if (s.y > canvas.height) {
            stars.splice(i, 1);
        }
    }
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
    let now = Date.now();
    
    // Vérifier si le cooldown est écoulé
    if (now - lastAttackTime < attackCooldown) {
        return; // Pas encore le moment d'attaquer
    }
    
    let attackExecuted = false;
    
    if (inputStates.left) {
        slashAnimations.push(new SlashAnimation(85, 395, Math.PI / 2));
        
        ctx.save();
        ctx.translate(105, 395); // Centre de l'épée
        ctx.rotate(Math.PI / 2);
        ctx.translate(-105, -395); // Revenir à la position d'origine
        
        ctx.drawImage(epee, 35, 350, 100, 90);
        //ctx.fillStyle = "red";
        ctx.fillRect(80, 360, 10, 70);
        ctx.restore();
        attackExecuted = true;
    }
    else if (inputStates.right) {
        slashAnimations.push(new SlashAnimation(125, 530, -Math.PI / 2));
        
        ctx.save();
        ctx.translate(105, 395); // Centre de l'épée
        ctx.rotate(-Math.PI / 2);
        ctx.translate(-105, -395); // Revenir à la position d'origine
        
        ctx.drawImage(epee, 75, 488, 100, 85);
        //ctx.fillStyle = "red";
        ctx.fillRect(120, 495, 10, 70);
        ctx.restore();
        attackExecuted = true;
    }
    else if (inputStates.up) {
        slashAnimations.push(new SlashAnimation(150, 252, 120*Math.PI / 90));
        
        ctx.save();
        ctx.translate(105, 395); // Centre de l'épée
        ctx.rotate(120*Math.PI / 90);
        ctx.translate(-105, -395); // Revenir à la position d'origine
        
        ctx.drawImage(epee, 65, 510, 100, 85);
        //ctx.fillStyle = "red";
        ctx.fillRect(110, 515, 10, 70);
        ctx.restore();
        attackExecuted = true;
    }
    else if (inputStates.down) {
        slashAnimations.push(new SlashAnimation(135, 532, -Math.PI / 3));
        
        ctx.save();
        ctx.translate(105, 395); // Centre de l'épée
        ctx.rotate(-Math.PI / 3);
        ctx.translate(-105, -395); // Revenir à la position d'origine
        
        ctx.drawImage(epee, 85, 490, 100, 85);
        //ctx.fillStyle = "red";
        ctx.fillRect(130, 495, 10, 70);
        ctx.restore();
        attackExecuted = true;
    }
    
    // Mettre à jour le cooldown et jouer le son si une attaque a été exécutée
    if (attackExecuted) {
        lastAttackTime = now;
        slashSound.play();
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
   

