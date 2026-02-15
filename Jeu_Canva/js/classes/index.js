import Player from "./player.js";
import { defineListeners, inputStates, initCanvasListeners, mousePosition, getAndConsumeClick } from "./ecouteurs_centralise.js";
import { circRectsOverlap } from "./collision.js";
import { SlashAnimation, SlashSound } from "./animation.js";
import { pomme, Star } from "./entity.js";

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

const pommeIMG = new Image();
pommeIMG.src = "assets/Pomme.png";

const btnBack = new Image();
btnBack.src = "assets/fleche_retour.png";

// Gestion des étoiles (stars)
let stars = [];
let lastStarTime = Date.now();
let nextStarInterval = Math.random() * (3000 - 2000) + 2000; // 2-7 secondes

// Gestion des pommes (pommes)
let pommes = [];
let lastpomme = Date.now();
let nextpomme = Math.random() * (3000 - 2000) + 2000;

// Système de difficulté
let difficulty = 1; // Multiplicateur de difficulté (commence à 1)
const DIFFICULTY_INCREASE = 0.1; // Augmentation par pomme frappée
const MIN_APPLE_SPAWN = 800; // Intervalle minimum de spawn des pommes
const MIN_STAR_SPAWN = 800; // Intervalle minimum de spawn des étoiles

// Système de score et combo
let score = 0;
let combo = 0;
let lastScore = 0;

let scores = {
    COMBAT: localStorage.getItem('highscore_COMBAT') ? parseInt(localStorage.getItem('highscore_COMBAT')) : 0,
    DEFENSE: localStorage.getItem('highscore_DEFENSE') ? parseInt(localStorage.getItem('highscore_DEFENSE')) : 0,
    ARCHERIE: localStorage.getItem('highscore_ARCHERIE') ? parseInt(localStorage.getItem('highscore_ARCHERIE')) : 0
};

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
    choix.forEach(item => {
        // Rectangle
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x + 50, item.y, item.w, item.h);
        
        // Texte Label
        ctx.fillStyle = "white";
        ctx.font = "20px sans-serif";
        ctx.fillText(item.label, item.x + item.w/2 + 50, item.y + item.h/2 + 10);

        // Affichage du HighScore spécifique sous chaque bouton
        ctx.font = "14px sans-serif";
        let key = item.label.toUpperCase();
        ctx.fillText("Record: " + scores[key], item.x + item.w/2 + 50, item.y + item.h + 20);
    });
    
    ctx.restore();
}


// Taille et position du bouton retour
const backBtn = { x: 20, y: 20, w: 50, h: 40 };

// Défense : centre du joueur et géométrie du bouclier (contrôlé par la souris)
const DEFENSE_PLAYER_CX = 425;
const DEFENSE_PLAYER_CY = 350;
const SHIELD_RADIUS = 60;
const SHIELD_HALF_ANGLE = (35 * Math.PI) / 180;

// Défense uniquement : listes et timers (pommes/étoiles de toutes directions)
let defensePommes = [];
let defenseStars = [];
let lastDefensePommeTime = 0;
let nextDefensePommeInterval = 1100; // une pomme au plus toutes les ~1,1 s (pas 2 au même moment)
let lastDefenseStarTime = 0;
let nextDefenseStarInterval = 3200;  // étoiles moins souvent que les pommes
const DEFENSE_POMME_SPEED = 1.8;
const DEFENSE_STAR_SPEED = 1.2;
const DEFENSE_MARGIN = 50;

initCanvasListeners(canvas);

/** Traite un éventuel clic (menu, choix de jeu, retour) et met à jour le curseur. */
function processInput() {
    const rect = canvas.getBoundingClientRect();
    const back = { x: 10, y: 35, w: 45, h: 35 };

    const click = getAndConsumeClick();
    if (click) {
        const pos = { x: click.clientX - rect.left - 13, y: click.clientY - rect.top + 14 };
        const pos2 = { x: click.clientX - rect.left - 50, y: click.clientY + 2 - rect.top };
        if (gameState === "MENU" && isInside(pos, playBtn)) {
            gameState = "CHOIX";
            return;
        }
        if (gameState === "CHOIX") {
            choix.forEach((item) => {
                if (isInside(pos2, item)) {
                    if (item.label === "Combat") gameState = "COMBAT";
                    if (item.label === "Defense") {
                        gameState = "DEFENSE";
                        defensePommes = [];
                        defenseStars = [];
                    }
                    if (item.label === "Archerie") gameState = "ARCHERIE";
                }
            });
            return;
        }
        if ((gameState === "COMBAT" || gameState === "DEFENSE" || gameState === "ARCHERIE") && isInside(pos, back)) {
            gameState = "CHOIX";
        }
    }

    const pos = { x: mousePosition.x - 13, y: mousePosition.y + 14 };
    const pos2 = { x: mousePosition.x - 50, y: mousePosition.y + 2 };
    hoveredItem = null;
    if (gameState === "MENU" && isInside(pos, playBtn)) hoveredItem = pos;
    if (gameState === "CHOIX") {
        choix.forEach((item) => {
            if (isInside(pos2, item)) hoveredItem = item;
        });
    }
    if ((gameState === "COMBAT" || gameState === "DEFENSE" || gameState === "ARCHERIE") && isInside(pos, back)) {
        hoveredItem = backBtn;
    }
    canvas.style.cursor = hoveredItem ? "pointer" : "default";
}

function drawBackButton() {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "30px Arial";
    // Dessin d'une flèche simple "←"
    ctx.drawImage(btnBack, backBtn.x, backBtn.y, backBtn.w, backBtn.h);
    ctx.restore();
}

function drawCombat() {
    ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    ctx.save();
    drawPlayer();
    updateStars();
    updatepommes();
    
    // Dessiner et mettre à jour les animations de slash
    for (let i = slashAnimations.length - 1; i >= 0; i--) {
        slashAnimations[i].draw(ctx, canvas);
        if (slashAnimations[i].isFinished) {
            slashAnimations.splice(i, 1);
        }
    }
    
    // Afficher le score et combo
    drawScoreAndCombo();
    
    ctx.restore();
}

/** Retourne true si le point (px, py) est dans l’arc du bouclier (mode Défense). */
function isPointInShieldArc(px, py) {
    const dx = px - DEFENSE_PLAYER_CX;
    const dy = py - DEFENSE_PLAYER_CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > SHIELD_RADIUS + 20) return false;
    const angle = Math.atan2(dy, dx);
    const mouseAngle = Math.atan2(
        mousePosition.y - DEFENSE_PLAYER_CY,
        mousePosition.x - DEFENSE_PLAYER_CX
    );
    let diff = angle - mouseAngle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return Math.abs(diff) <= SHIELD_HALF_ANGLE;
}

function drawShield() {
    const mouseAngle = Math.atan2(
        mousePosition.y - DEFENSE_PLAYER_CY,
        mousePosition.x - DEFENSE_PLAYER_CX
    );
    const startAngle = mouseAngle - SHIELD_HALF_ANGLE;
    const endAngle = mouseAngle + SHIELD_HALF_ANGLE;
    ctx.save();
    ctx.beginPath();
    ctx.arc(DEFENSE_PLAYER_CX, DEFENSE_PLAYER_CY, SHIELD_RADIUS, startAngle, endAngle);
    ctx.lineTo(DEFENSE_PLAYER_CX, DEFENSE_PLAYER_CY);
    ctx.closePath();
    ctx.fillStyle = "rgba(100, 149, 237, 0.6)";
    ctx.strokeStyle = "rgba(70, 100, 200, 0.9)";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

/**
 * Spawn une pomme depuis un bord aléatoire, se dirigeant vers le joueur.
 * Une seule pomme par intervalle (pas deux au même endroit / même moment).
 */
function spawnDefensePomme() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) {
        x = DEFENSE_MARGIN + Math.random() * (canvas.width - 2 * DEFENSE_MARGIN);
        y = -DEFENSE_MARGIN;
    } else if (side === 1) {
        x = canvas.width + DEFENSE_MARGIN;
        y = DEFENSE_MARGIN + Math.random() * (canvas.height - 2 * DEFENSE_MARGIN);
    } else if (side === 2) {
        x = DEFENSE_MARGIN + Math.random() * (canvas.width - 2 * DEFENSE_MARGIN);
        y = canvas.height + DEFENSE_MARGIN;
    } else {
        x = -DEFENSE_MARGIN;
        y = DEFENSE_MARGIN + Math.random() * (canvas.height - 2 * DEFENSE_MARGIN);
    }
    const dx = DEFENSE_PLAYER_CX - x;
    const dy = DEFENSE_PLAYER_CY - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    
    // MODIFICATION ICI : On multiplie par 'difficulty' pour accélérer les pommes
    const speed = (DEFENSE_POMME_SPEED * (0.8 + Math.random() * 0.4)) * difficulty;
    
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    const p = new pomme(x, y, 30, 30, vx, vy);
    p.playerColorOnHit = "red";
    defensePommes.push(p);
}

/**
 * Spawn une étoile depuis un bord aléatoire (moins souvent que les pommes).
 */
function spawnDefenseStar() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) {
        x = DEFENSE_MARGIN + Math.random() * (canvas.width - 2 * DEFENSE_MARGIN);
        y = -DEFENSE_MARGIN;
    } else if (side === 1) {
        x = canvas.width + DEFENSE_MARGIN;
        y = DEFENSE_MARGIN + Math.random() * (canvas.height - 2 * DEFENSE_MARGIN);
    } else if (side === 2) {
        x = DEFENSE_MARGIN + Math.random() * (canvas.width - 2 * DEFENSE_MARGIN);
        y = canvas.height + DEFENSE_MARGIN;
    } else {
        x = -DEFENSE_MARGIN;
        y = DEFENSE_MARGIN + Math.random() * (canvas.height - 2 * DEFENSE_MARGIN);
    }
    const dx = DEFENSE_PLAYER_CX - x;
    const dy = DEFENSE_PLAYER_CY - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = DEFENSE_STAR_SPEED * (0.7 + Math.random() * 0.5);
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    defenseStars.push({
        x, y, width: 30, height: 30, vx, vy,
        update() { this.x += this.vx; this.y += this.vy; }
    });
}

/**
 * Logique complète du mode Défense : spawn pommes/étoiles de toutes directions,
 * étoiles moins souvent, une pomme à la fois (pas 2 au même moment), collisions bouclier/joueur.
 */
function updateDefense() {
    const now = Date.now();

    // --- GESTION DU SPAWN (Pommes) ---
    if (now - lastDefensePommeTime >= nextDefensePommeInterval) {
        spawnDefensePomme();
        lastDefensePommeTime = now;
        // La fréquence augmente avec la difficulté
        nextDefensePommeInterval = (900 + Math.random() * 500) / difficulty;
        if(nextDefensePommeInterval < 200) nextDefensePommeInterval = 200;
    }
    
    // --- GESTION DU SPAWN (Étoiles) ---
    if (now - lastDefenseStarTime >= nextDefenseStarInterval) {
        spawnDefenseStar();
        lastDefenseStarTime = now;
        nextDefenseStarInterval = 2800 + Math.random() * 1200;
    }

    // --- BOUCLE DES ÉTOILES ---
    for (let i = defenseStars.length - 1; i >= 0; i--) {
        const s = defenseStars[i];
        s.update();
        ctx.drawImage(star, s.x, s.y, s.width, s.height);

        // Calcul du centre de l'étoile
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;

        // 1. COLLISION BOUCLIER (NOUVEAU)
        // Si l'étoile tape le bouclier, elle disparaît SANS donner de points
        if (isPointInShieldArc(cx, cy)) {
            defenseStars.splice(i, 1);
            continue; // On arrête là pour cette étoile
        }

        // 2. COLLISION CORPS DU JOUEUR (BONUS)
        // Si l'étoile touche le joueur (cercle central), on gagne des points
        const distStarPlayer = Math.sqrt((cx - DEFENSE_PLAYER_CX) ** 2 + (cy - DEFENSE_PLAYER_CY) ** 2);
        
        if (distStarPlayer < 35) {
            score += 20;   
            combo += 2;    
            defenseStars.splice(i, 1); 
            continue;     
        }

        // Suppression si hors écran
        if (s.x + s.width < -20 || s.x > canvas.width + 20 || s.y + s.height < -20 || s.y > canvas.height + 20) {
            defenseStars.splice(i, 1);
        }
    }

    // --- BOUCLE DES POMMES ---
    for (let i = defensePommes.length - 1; i >= 0; i--) {
        const p = defensePommes[i];
        p.update();
        p.draw(ctx, pommeIMG);

        const cx = p.x + p.largeur / 2;
        const cy = p.y + p.hauteur / 2;
        
        // 1. COLLISION BOUCLIER (PARADE REUSSIE)
        if (isPointInShieldArc(cx, cy)) {
            defensePommes.splice(i, 1);
            difficulty += DIFFICULTY_INCREASE; // Ça accélère le jeu
            score += 10;
            combo += 1;
            continue;
        }
        
        // 2. COLLISION JOUEUR (DÉFAITE / RESET)
        const distToPlayer = Math.sqrt((cx - DEFENSE_PLAYER_CX) ** 2 + (cy - DEFENSE_PLAYER_CY) ** 2);
        
        if (distToPlayer < 35) {
            player.color = p.playerColorOnHit;
            lastScore = score;
            
            if (score > scores.DEFENSE) {
                scores.DEFENSE = score;
                localStorage.setItem("highscore_DEFENSE", score);
            }
            
            // Reset de la difficulté et du score
            difficulty = 1;
            score = 0;
            combo = 0;
            
            defensePommes.splice(i, 1);
        } else if (p.x + p.largeur < -30 || p.x > canvas.width + 30 || p.y + p.hauteur < -30 || p.y > canvas.height + 30) {
            defensePommes.splice(i, 1);
        }
    }
}

function drawDefense() {
    ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    ctx.save();
    drawPlayer();
    drawShield();
    updateDefense();
    drawScoreAndCombo();
    ctx.restore();
}

function drawArcherie() {
    ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    ctx.save();
    drawPlayer();

    updateStars();
    updatepommes();
    drawScoreAndCombo();
    ctx.restore();
}

function drawPlayer() {
    // Défense : personnage au centre ; Combat et Archerie : même position (à gauche)
    if (gameState === "DEFENSE") {
        player.draw2(ctx);
    } else {
        player.draw(ctx);
    }
}

function drawScoreAndCombo() {
    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = "bold 20px sans-serif";
    
    // Score actuel et Combo au centre
    ctx.textAlign = "center";
    ctx.fillText("COMBO: " + combo, canvas.width / 2, 30);
    ctx.fillText("SCORE: " + score, canvas.width / 2, 55);
    
    // Last Score à droite
    ctx.textAlign = "right";
    ctx.fillText("LAST: " + lastScore, canvas.width - 20, 35);
    
    ctx.restore();
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
        // Intervalle réduit selon la difficulté
        let baseInterval = Math.random() * (4500 - 2500) + 2500; // 2.5-4.5 secondes (moins d'étoiles)
        nextStarInterval = Math.max(MIN_STAR_SPAWN, baseInterval / difficulty-1); // Réduit par la difficulté
    }
    
    // Mettre à jour et dessiner les étoiles
    for (let i = stars.length - 1; i >= 0; i--) {
        let s = stars[i];
        s.y += s.speed; // Faire tomber l'étoile
        
        // Dessiner l'étoile
        ctx.drawImage(star, s.x, s.y, s.width, s.height);
        
        // En mode Défense : les étoiles ne sont pas bloquées, elles doivent passer
        if (gameState !== "DEFENSE") {
            // Vérifier collision avec l'épée du côté gauche seulement (Combat / Archerie)
            if (inputStates.left) {
                if (circRectsOverlap(80, 360, 10, 70, s.x + s.width/2, s.y + s.height/2, 15)) {
                    score += 20;
                    combo += 2;
                    stars.splice(i, 1);
                    continue;
                }
            }
        }
        
        // Supprimer les étoiles qui sortent du bas
        if (s.y > canvas.height) {
            stars.splice(i, 1);
        }
    }
}

function updatepommes() {
    let now = Date.now();
    
    // Créer une nouvelle pomme si l'intervalle est écoulé
    if (now - lastpomme > nextpomme) {
        // La vitesse augmente avec la difficulté
        let baseSpeed = Math.random() * 1+1.5; // 0.5-1.5 (bien plus lent au début)
        let speed = baseSpeed * difficulty;
        let pommeType = Math.floor(Math.random() * 3); // 0: milieu, 1: haut, 2: bas
        let y, vy, playerColorOnHit, hitMessage;
        
        // Déterminer les paramètres selon le type de pomme
        if (pommeType === 1) { // Pomme du haut
            y = 250;
            vy = speed * 0.06;
            playerColorOnHit = "yellow";
            hitMessage = "Touché par une pomme venant du Haut";
        } else if (pommeType === 0) { // Pomme du milieu
            y = 350;
            vy = 0;
            playerColorOnHit = "red";
            hitMessage = "Touché par une pomme venant du Milieu";
        } else { // Pomme du bas
            y = 450;
            vy = -speed * 0.06;
            playerColorOnHit = "green";
            hitMessage = "Touché par une pomme venant du Bas";
        }
        
        let newpomme = new pomme(850, y, 30, 30, -speed, vy);
        newpomme.type = pommeType;
        newpomme.playerColorOnHit = playerColorOnHit;
        newpomme.hitMessage = hitMessage;
        
        pommes.push(newpomme);
        lastpomme = now;
        // Intervalle de spawn réduit selon la difficulté (pour plus de pommes)
        let baseInterval = Math.random() * (1500 - 700) + 700; // 0.7-1.2 secondes (plus de pommes)
        nextpomme = Math.max(MIN_APPLE_SPAWN, baseInterval / difficulty); // Réduit par la difficulté
    }
    
    // Mettre à jour et dessiner les pommes
    for (let i = pommes.length - 1; i >= 0; i--) {
        let p = pommes[i];
        p.update();
        p.draw(ctx, pommeIMG);

        if (gameState === "DEFENSE") {
            // Mode Défense : bouclier bloqué par la souris — bloquer les pommes, laisser passer les étoiles (géré dans updateStars)
            const pommeCx = p.x + p.largeur / 2;
            const pommeCy = p.y + p.hauteur / 2;
            if (isPointInShieldArc(pommeCx, pommeCy)) {
                pommes.splice(i, 1);
                difficulty += DIFFICULTY_INCREASE;
                score += 10;
                combo += 1;
                continue;
            }
            // Pomme a dépassé le joueur sans être bloquée = touché
            if (p.x + p.largeur < DEFENSE_PLAYER_CX - 20) {
                player.color = p.playerColorOnHit;
                lastScore = score;
                if (score > scores[gameState]) {
                    scores[gameState] = score;
                    localStorage.setItem("highscore_" + gameState, score);
                }
                difficulty = 1;
                score = 0;
                combo = 0;
                pommes.splice(i, 1);
            }
            continue;
        }

        // Mode Combat / Archerie : collision avec l'épée selon le type de pomme
        if (p.type === 0 && inputStates.right) {
            if (circRectsOverlap(250, 350, 55, 70, p.x + p.largeur/2+25 , p.y + p.hauteur/2, 15)) {
                pommes.splice(i, 1);
                difficulty += DIFFICULTY_INCREASE;
                score += 10;
                combo += 1;
                continue;
            }
        } else if (p.type === 1 && inputStates.up) {
            if (circRectsOverlap(110, 250, 20, 70, p.x + p.largeur/2, p.y + p.hauteur/2 + 500, 500)) {
                pommes.splice(i, 1);
                // Augmenter la difficulté, score et combo
                difficulty += DIFFICULTY_INCREASE;
                score += 10;
                combo += 1;
                continue;
            }
        } else if (p.type === 2 && inputStates.down) {
            if (circRectsOverlap(250, 440, 20, 70, p.x + p.largeur/2 + 500, p.y + p.hauteur/2, 500)) {
                pommes.splice(i, 1);
                console.log("Pomme Bas touchée! Difficulté: " + difficulty.toFixed(2));
                // Augmenter la difficulté, score et combo
                difficulty += DIFFICULTY_INCREASE;
                score += 10;
                combo += 1;
                continue;
            }
        }

        // Pomme qui sort de l'écran ou touche le joueur
        if (p.x + 250 < player.x) {
            player.color = p.playerColorOnHit;
            console.log(p.hitMessage);
            console.log("Difficulté réinitialisée à 1");
            
            // Sauvegarder le score et reset
            lastScore = score;
            if (score > scores[gameState]) {
                scores[gameState] = score;
                localStorage.setItem('highscore_' + gameState, score);
                console.log("Nouveau record en " + gameState + ": " + score);
            }
            
            // Réinitialiser la difficulté et le score
            difficulty = 1;
            score = 0;
            combo = 0;
            pommes.splice(i, 1);
        }
    }
}


function attaqueJoueur() {
    let now = Date.now();
    
    // Vérifier si le cooldown est écoulé
    if (now - lastAttackTime < attackCooldown) {
        return; // Pas encore le moment d'attaquer
    }
    
    let attackExecuted = false;
    
    if (inputStates.left) {
        slashAnimations.push(new SlashAnimation(80, 350, -Math.PI / 10));
        
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
        slashAnimations.push(new SlashAnimation(180, 380, 60*Math.PI / 30));
        
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
    processInput();
    defineListeners();

    // 2 - on dessine tous les objets du jeu en fonction de l'état du jeu
    if (gameState === "MENU") {
        drawMenu();
    } else if (gameState === "CHOIX") {
        drawChoix();
    } else if (gameState === "COMBAT") {
        drawCombat();
        attaqueJoueur();
        drawBackButton()
    } else if (gameState === "DEFENSE") {
        drawDefense();
        drawBackButton()
    } else if (gameState === "ARCHERIE") {
        drawArcherie();
        drawBackButton()
    }

    requestAnimationFrame(Gameloop);
}


Gameloop();
   

