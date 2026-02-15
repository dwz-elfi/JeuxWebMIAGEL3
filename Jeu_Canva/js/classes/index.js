import Player from "./player.js";
import { defineListeners, inputStates, initCanvasListeners, mousePosition, getAndConsumeClick } from "./ecouteurs_centralise.js";
import { circRectsOverlap } from "./collision.js";
import { SlashAnimation, SlashSound } from "./animation.js";
import { pomme, Star } from "./entity.js";
import { loadAssets } from "./assetsLoader.js";

const canvas = document.getElementById("zoneJeu");
const ctx = canvas.getContext("2d");

let player = new Player(425, 325, 50, 50);

const width = 850;
const height = 650;

let imgMenu;
let fond;
let epee;
let bouclier;
let star;
let pommeIMG;
let btnBack;
let imgArc;
let slashSound;

const assetsALoader = {
    menu: { url: "assets/Swords_Bravery.png" },
    fond: { url: "assets/fond_jeu.png" },
    epee: { url: "assets/epee.png" },
    bouclier: { url: "assets/shield.png" },
    star: { url: "assets/star.png" },
    pomme: { url: "assets/Pomme.png" },
    back: { url: "assets/fleche_retour.png" },
    arc: { url: "assets/arc.png" },
    //Configuration du son pour Howler
    slashSound: { url: "assets/slash.mp3", buffer: true, loop: false, volume: 0.5 } 
};

//Gestion des étoiles
let stars = [];
let lastStarTime = Date.now();
let nextStarInterval = Math.random() * (3000 - 2000) + 2000; //2-7 secondes

//Gestion des pommes 
let pommes = [];
let lastpomme = Date.now();
let nextpomme = Math.random() * (3000 - 2000) + 2000;

//Système de difficulté
let difficulty = 1; //Multiplicateur de difficulté
const DIFFICULTY_INCREASE = 0.08; //Augmentation par pomme frappée
const MIN_APPLE_SPAWN = 750; //Intervalle minimum de spawn des pommes
const MIN_STAR_SPAWN = 850; //Intervalle minimum de spawn des étoiles

//Système de score et combo
let score = 0;
let combo = 0;
let lastScore = 0;

let scores = {
    COMBAT: 0,
    DEFENSE: 0,
    ARCHERIE: 0
};

let saveCombat = localStorage.getItem('highscore_COMBAT')
if (saveCombat != null) {
    scores.COMBAT = parseInt(saveCombat);
}
let saveDefense = localStorage.getItem('highscore_DEFENSE');
if (saveDefense != null) {
    scores.DEFENSE = parseInt(saveDefense);
}
let saveArcherie = localStorage.getItem('highscore_ARCHERIE');
if (saveArcherie != null) {
    scores.ARCHERIE = parseInt(saveArcherie);
}

//--- VARIABLES ARCHERIE (uniquement pour le mode Archerie) ---
let vitesseFleche = 5; 
let dernierTir = 0;
let delaiTir = 380; //Cooldown
let arrows = [];
const ARCHERIE_ORIGIN_X = 200;
let archeriePommes = [];
let archerieStars = [];
let lastArcheriePommeTime = 0;
let nextArcheriePommeInterval = 1200;
let lastArcherieStarTime = 0;
let nextArcherieStarInterval = 2800;
const ARCHERIE_POMME_SPEED = 2.2;
let archerieClique = null; 

//Cooldown de l'épée
let lastAttackTime = 0;
const attackCooldown = 250;

//Animations et sons
let slashAnimations = [];

let gameState = "MENU";
//Taille/ position du bouton play
let playBtn = {x:canvas.width/2-100, y:canvas.height/2-25, w:200, h:50};

//pointeur cursor
let hoveredItem = null;

function drawMenu(){
    ctx.drawImage(imgMenu, 0, 0, canvas.width, canvas.height);
    ctx.save();
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
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x + 50, item.y, item.w, item.h);
        ctx.fillStyle = "white";
        ctx.font = "20px sans-serif";
        ctx.fillText(item.label, item.x + item.w/2 + 50, item.y + item.h/2 + 10);

        //Affichage du HighScore spécifique sous chaque bouton
        ctx.font = "14px sans-serif";
        let i = item.label.toUpperCase();
        ctx.fillText("Record: " + scores[i], item.x + item.w/2 + 50, item.y + item.h + 20);
    });
    ctx.restore();
}

//Taille et position du bouton retour
const backBtn = { x: 20, y: 20, w: 50, h: 40 };

//Position de la méca de défense du joueur
const DEFENSE_PLAYER_CX = 425;
const DEFENSE_PLAYER_CY = 350;

//listes et timers pommes/étoiles
let defensePommes = [];
let defenseStars = [];
let lastDefensePommeTime = 0;
let nextDefensePommeInterval = 1100;
let lastDefenseStarTime = 0;
let nextDefenseStarInterval = 3200; 
const DEFENSE_POMME_SPEED = 1.85;
const DEFENSE_STAR_SPEED = 1.2;
const DEFENSE_MARGIN = 50;

initCanvasListeners(canvas);

function processInput() {
    let rect = canvas.getBoundingClientRect();
    //On définit le bouton retour en dur ici
    let back = { x: 10, y: 35, w: 45, h: 35 };

    let click = getAndConsumeClick();

    if (click != null) {
        //Calcul des positions de la souris
        let sourisX = click.clientX - rect.left - 13;
        let sourisY = click.clientY - rect.top + 14;
        let posSouris = { x: sourisX, y: sourisY };

        //Position spéciale pour le menu Choix 
        let sourisX_Choix = click.clientX - rect.left - 50;
        let sourisY_Choix = click.clientY - rect.top + 2;
        let posSouris_Choix = { x: sourisX_Choix, y: sourisY_Choix };

        if (gameState == "MENU") {
            if (isInside(posSouris, playBtn)) {
                gameState = "CHOIX";
                return
            }
        }

        if (gameState == "CHOIX") {
            for (let i = 0; i < choix.length; i++) {
                let bouton = choix[i];
                
                if (isInside(posSouris_Choix, bouton)) {
                    //On vide les tableaux avec le reset des scores
                    score = 0;
                    combo = 0;
                    difficulty = 1;
                    pommes = [];
                    stars = [];
                    defensePommes = [];
                    defenseStars = [];
                    archeriePommes = [];
                    archerieStars = [];
                    arrows = [];
                    if (bouton.label == "Combat") {
                        gameState = "COMBAT";
                    }
                    if (bouton.label == "Defense") {
                        gameState = "DEFENSE";
                    }
                    if (bouton.label == "Archerie") {
                        gameState = "ARCHERIE";
                        return
                    }
                }
            }
        }

        let enJeu = false;
        if (gameState == "COMBAT") { 
            enJeu = true; 
        }
        if (gameState == "DEFENSE") { 
            enJeu = true; 
        }
        if (gameState == "ARCHERIE") { 
            enJeu = true; 
        }
        if (enJeu == true) {
            if (isInside(posSouris, back)) {
                gameState = "CHOIX";
            } 
            else {
                if (gameState == "ARCHERIE") {
                    //si on clique ça tire la flèche
                    archerieClique = { 
                        x: click.clientX - rect.left, 
                        y: click.clientY - rect.top 
                    };
                }
            }
        }
    }
    //Gestion du curseur
    let sourisActuelleX = mousePosition.x - 13;
    let sourisActuelleY = mousePosition.y + 14;
    let posCurseur = { x: sourisActuelleX, y: sourisActuelleY };

    let sourisChoixX = mousePosition.x - 50;
    let sourisChoixY = mousePosition.y + 2;
    let posCurseurChoix = { x: sourisChoixX, y: sourisChoixY };
    let Survol = false;

    if (gameState == "MENU") {
        if (isInside(posCurseur, playBtn)) {
            Survol = true;
        }
    }

    if (gameState == "CHOIX") {
        for (let i = 0; i < choix.length; i++) {
            let bouton = choix[i];
            if (isInside(posCurseurChoix, bouton)) {
                Survol = true;
            }
        }
    }

    //Vérif bouton retour en jeu
    if (gameState == "COMBAT") { 
        if (isInside(posCurseur, back)) Survol = true; }
    if (gameState == "DEFENSE") { 
        if (isInside(posCurseur, back)) Survol = true; }
    if (gameState == "ARCHERIE") { 
        if (isInside(posCurseur, back)) Survol = true; }

    if (Survol == true) {
        canvas.style.cursor = "pointer";
    } else {
        canvas.style.cursor = "default";
    }
}


function drawBackButton() {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "30px Arial";
    ctx.drawImage(btnBack, backBtn.x, backBtn.y, backBtn.w, backBtn.h);
    ctx.restore();
}

function drawCombat() {
    ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    ctx.save();
    // On dessine le joueur
    drawPlayer();
    // Mise à jour des ennemis et du décor
    updateStars();
    updatepommes();
    
    // Gestion des animations d'attaque 
    for (let i = 0; i < slashAnimations.length; i++) {
        let anim = slashAnimations[i];

        anim.draw(ctx, canvas);

        //Si l'animation est finie, on la supprime de la liste
        if (anim.isFinished == true) {
            slashAnimations.splice(i, 1);
            i--; 
        }
    }
    // Affichage du score
    drawScoreAndCombo();
    ctx.restore();
}

function collisionBouclier(xObjet, yObjet) {
    //Calcul de la distance
    let diffX = xObjet - DEFENSE_PLAYER_CX;
    let diffY = yObjet - DEFENSE_PLAYER_CY;
    let distance = Math.sqrt(diffX*diffX + diffY*diffY);
    if (distance > 100) { 
        return false;
    }

    // Calcul des angles (trouvé sur internet pour gérer la rotation)
    let angleObjet = Math.atan2(diffY, diffX);
    
    //Angle de la souris par rapport au joueur
    let angleSouris = Math.atan2(mousePosition.y - DEFENSE_PLAYER_CY, mousePosition.x - DEFENSE_PLAYER_CX);

    //On regarde la différence entre l'angle de l'objet et l'angle du bouclier
    let difference = angleObjet - angleSouris;

    //Petite correction pour que ça boucle bien
    while (difference > Math.PI) { difference = difference - 2 * Math.PI; }
    while (difference < -Math.PI) { difference = difference + 2 * Math.PI; }

    //ça touche avec une marge au cas où
    if (Math.abs(difference) <= 0.6) {
        return true;
    }
    
    return false;
}


function drawShield() {
    
        //On calcule l'angle pour que le bouclier regarde la souris
        let angle = Math.atan2(mousePosition.y - DEFENSE_PLAYER_CY, mousePosition.x - DEFENSE_PLAYER_CX);
    
        ctx.save();
        
        //On se place au centre du joueur
        ctx.translate(DEFENSE_PLAYER_CX, DEFENSE_PLAYER_CY);
        
        //On tourne le contexte
        ctx.rotate(angle);
        
        //ON DESSINE L'IMAGE
        //40 : C'est la distance par rapport au corps (le rayon)
        //-30 : C'est pour centrer l'image verticalement (la moitié de sa hauteur 60)
        //60, 60 : C'est la taille de l'image
        ctx.drawImage(bouclier, 40, -30, 60, 60);
        
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
    
    //On multiplie pour accélérer les pommes
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

    //--- GESTION DU SPAWN (Pommes) ---
    if (now - lastDefensePommeTime >= nextDefensePommeInterval) {
        spawnDefensePomme();
        lastDefensePommeTime = now;
        //La fréquence augmente avec la difficulté
        nextDefensePommeInterval = (900 + Math.random() * 500) / difficulty;
        if(nextDefensePommeInterval < 200) nextDefensePommeInterval = 200;
    }
    
    //--- GESTION DU SPAWN (Étoiles) ---
    if (now - lastDefenseStarTime >= nextDefenseStarInterval) {
        spawnDefenseStar();
        lastDefenseStarTime = now;
        nextDefenseStarInterval = 2800 + Math.random() * 1200;
    }

    //--- BOUCLE DES ÉTOILES ---
    for (let i = defenseStars.length - 1; i >= 0; i--) {
        const s = defenseStars[i];
        s.update();
        ctx.drawImage(star, s.x, s.y, s.width, s.height);

        //Calcul du centre de l'étoile
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;

        // COLLISION BOUCLIER (NOUVEAU)
        //Si l'étoile tape le bouclier, elle disparaît SANS donner de points
        if (collisionBouclier(cx, cy)) {
            defenseStars.splice(i, 1);
            continue; //On arrête là pour cette étoile
        }

        // COLLISION CORPS DU JOUEUR (BONUS)
        //Si l'étoile touche le joueur (cercle central), on gagne des points
        const distStarPlayer = Math.sqrt((cx - DEFENSE_PLAYER_CX) ** 2 + (cy - DEFENSE_PLAYER_CY) ** 2);
        
        if (distStarPlayer < 35) {
            score += 20;   
            combo += 2;    
            defenseStars.splice(i, 1); 
            continue;     
        }

        //Suppression si hors écran
        if (s.x + s.width < -20 || s.x > canvas.width + 20 || s.y + s.height < -20 || s.y > canvas.height + 20) {
            defenseStars.splice(i, 1);
        }
    }

    //--- BOUCLE DES POMMES ---
    for (let i = defensePommes.length - 1; i >= 0; i--) {
        const p = defensePommes[i];
        p.update();
        p.draw(ctx, pommeIMG);

        const cx = p.x + p.largeur / 2;
        const cy = p.y + p.hauteur / 2;
        
        // COLLISION BOUCLIER (PARADE REUSSIE)
        if (collisionBouclier(cx, cy)) {
            defensePommes.splice(i, 1);
            difficulty += DIFFICULTY_INCREASE; //Ça accélère le jeu
            score += 10;
            combo += 1;
            continue;
        }
        
        // COLLISION JOUEUR (DÉFAITE / RESET)
        const distToPlayer = Math.sqrt((cx - DEFENSE_PLAYER_CX) ** 2 + (cy - DEFENSE_PLAYER_CY) ** 2);
        
        if (distToPlayer < 35) {
            player.color = p.playerColorOnHit;
            lastScore = score;
            
            if (score > scores.DEFENSE) {
                scores.DEFENSE = score;
                localStorage.setItem("highscore_DEFENSE", score);
            }
            
            //Reset de la difficulté et du score
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

function drawPlayer() {
    //Défense : personnage au centre ; Combat et Archerie : même position (à gauche)
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
    
    //Score actuel et Combo au centre
    ctx.textAlign = "center";
    ctx.fillText("COMBO: " + combo, canvas.width / 2, 30);
    ctx.fillText("SCORE: " + score, canvas.width / 2, 55);
    
    //Last Score à droite
    ctx.textAlign = "right";
    ctx.fillText("LAST: " + lastScore, canvas.width - 20, 35);
    
    ctx.restore();
}

function updateStars() {
    let now = Date.now();
    
    //Créer une nouvelle étoile si l'intervalle est écoulé
    if (now - lastStarTime > nextStarInterval) {
        let newStar = {
            x: 55,
            y: -30,
            width: 30,
            height: 30,
            speed: Math.random() * 4 + 1 //Vitesse aléatoire 1-3 px/frame
        };
        stars.push(newStar);
        lastStarTime = now;
        //Intervalle réduit selon la difficulté
        let baseInterval = Math.random() * (4500 - 2500) + 2500; //5-4.5 secondes (moins d'étoiles)
        nextStarInterval = Math.max(MIN_STAR_SPAWN, baseInterval / difficulty-1); //Réduit par la difficulté
    }
    
    //Mettre à jour et dessiner les étoiles
    for (let i = stars.length - 1; i >= 0; i--) {
        let s = stars[i];
        s.y += s.speed; //Faire tomber l'étoile
        
        //Dessiner l'étoile
        ctx.drawImage(star, s.x, s.y, s.width, s.height);
        
        //En mode Défense : les étoiles ne sont pas bloquées, elles doivent passer
        if (gameState !== "DEFENSE") {
            //Vérifier collision avec l'épée du côté gauche seulement (Combat / Archerie)
            if (inputStates.left) {
                if (circRectsOverlap(80, 360, 10, 70, s.x + s.width/2, s.y + s.height/2, 15)) {
                    score += 20;
                    combo += 2;
                    stars.splice(i, 1);
                    continue;
                }
            }
        }
        
        //Supprimer les étoiles qui sortent du bas
        if (s.y > canvas.height) {
            stars.splice(i, 1);
        }
    }
}

function updatepommes() {
    let now = Date.now();
    
    //Créer une nouvelle pomme si l'intervalle est écoulé
    if (now - lastpomme > nextpomme) {
        //La vitesse augmente avec la difficulté
        let baseSpeed = Math.random() * 1+1.5; //0.5-1.5 (bien plus lent au début)
        let speed = baseSpeed * difficulty;
        let pommeType = Math.floor(Math.random() * 3); //0: milieu, 1: haut, 2: bas
        let y, vy, playerColorOnHit, hitMessage;
        
        //Déterminer les paramètres selon le type de pomme
        if (pommeType === 1) { //pomme haut
            y = 250;
            vy = speed * 0.06;
            playerColorOnHit = "yellow";
            hitMessage = "Touché par une pomme venant du Haut";
        } else if (pommeType === 0) { 
            y = 350;
            vy = 0; //pomme mid
            playerColorOnHit = "red";
            hitMessage = "Touché par une pomme venant du Milieu";
        } else {
            y = 450;
            vy = -speed * 0.06;  //Pomme du bas vers le haut
            playerColorOnHit = "green";
            hitMessage = "Touché par une pomme venant du Bas";
        }
        
        let newpomme = new pomme(850, y, 30, 30, -speed, vy);
        newpomme.type = pommeType;
        newpomme.playerColorOnHit = playerColorOnHit;
        newpomme.hitMessage = hitMessage;
        
        pommes.push(newpomme);
        lastpomme = now;
        //Intervalle de spawn réduit selon la difficulté (pour plus de pommes)
        let baseInterval = Math.random() * (1500 - 700) + 700;
        nextpomme = Math.max(MIN_APPLE_SPAWN, baseInterval / difficulty); 
    }
    
    //Mettre à jour et dessiner les pommes
    for (let i = pommes.length - 1; i >= 0; i--) {
        let p = pommes[i];
        p.update();
        p.draw(ctx, pommeIMG);

        if (gameState === "DEFENSE") {
            const pommeCx = p.x + p.largeur / 2;
            const pommeCy = p.y + p.hauteur / 2;
            if (collisionBouclier(pommeCx, pommeCy)) {
                pommes.splice(i, 1);
                difficulty += DIFFICULTY_INCREASE;
                score += 10;
                combo += 1;
                continue;
            }
            //le joueur est toucheé
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

        //Collision avec l'épée
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
                //Augmenter la difficulté, score et combo
                difficulty += DIFFICULTY_INCREASE;
                score += 10;
                combo += 1;
                continue;
            }
        } else if (p.type === 2 && inputStates.down) {
            if (circRectsOverlap(250, 440, 20, 70, p.x + p.largeur/2 + 500, p.y + p.hauteur/2, 500)) {
                pommes.splice(i, 1);
                console.log("Pomme Bas touchée! Difficulté: " + difficulty.toFixed(2));
                //Augmenter la difficulté, score et combo
                difficulty += DIFFICULTY_INCREASE;
                score += 10;
                combo += 1;
                continue;
            }
        }

        //Pomme qui sort de l'écran ou touche le joueur
        if (p.x + 250 < player.x) {
            player.color = p.playerColorOnHit;
            console.log(p.hitMessage);
            console.log("Difficulté réinitialisée à 1");
            
            //Sauvegarder le score et reset
            lastScore = score;
            if (score > scores[gameState]) {
                scores[gameState] = score;
                localStorage.setItem('highscore_' + gameState, score);
                console.log("Nouveau record en " + gameState + ": " + score);
            }
            
            //Réinitialiser la difficulté et le score
            difficulty = 1;
            score = 0;
            combo = 0;
            pommes.splice(i, 1);
        }
    }
}

function spawnArcheriePomme() {
    const lane = Math.floor(Math.random() * 3);
    let y = 0;
    
    if (lane === 0) {
        y = 280;
    } else if (lane === 1) {
        y = 350;
    } else {
        y = 420;
    }

    const vx = -(ARCHERIE_POMME_SPEED * difficulty-0.2);
    const p = new pomme(canvas.width + 30, y, 30, 30, vx, 0);
    p.playerColorOnHit = "red";
    archeriePommes.push(p);
}

function spawnArcherieStar() {
    let x = canvas.width + 25;
    let y = 100 + Math.random() * 400;
    let vx = -2; 
    let vy = 0;

    archerieStars.push({
        x: x, y: y, width: 28, height: 28, vx: vx, vy: vy,
        update() { this.x += this.vx; this.y += this.vy; } 
    });
}

function updateArcherie() {
    const now = Date.now();

    //Spawns
    if (now - lastArcheriePommeTime >= nextArcheriePommeInterval) {
        spawnArcheriePomme();
        lastArcheriePommeTime = now;
        nextArcheriePommeInterval = 1000; 
    }

    if (now - lastArcherieStarTime >= nextArcherieStarInterval) {
        spawnArcherieStar();
        lastArcherieStarTime = now;
        nextArcherieStarInterval = 3000;
    }

    //Mise à jour étoiles (boucle classique)
    for (let i = 0; i < archerieStars.length; i++) {
        let s = archerieStars[i];
        s.update();
        ctx.drawImage(star, s.x, s.y, s.width, s.height);
        
        if (s.x < -50) {
            archerieStars.splice(i, 1);
            i = i - 1;
        }
    }

    //Mise à jour pommes
    for (let i = 0; i < archeriePommes.length; i++) {
        let p = archeriePommes[i];
        p.update();
        p.draw(ctx, pommeIMG);

        //Joueur touché
        if (p.x + p.largeur < ARCHERIE_ORIGIN_X + 25) {
            lastScore = score;
            if (score > scores.ARCHERIE) {
                scores.ARCHERIE = score;
                localStorage.setItem("highscore_ARCHERIE", score);
            }
            difficulty = 1;
            score = 0;
            combo = 0;
            archeriePommes = [];
        }
    }

    //Mise à jour flèches
    for (let i = 0; i < arrows.length; i++) {
        let a = arrows[i];
        a.x += a.vx;
        a.y += a.vy;

        //DESSIN FLECHE
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.fillStyle = "black";
        ctx.fillRect(0, -2, 30, 4); 
        ctx.restore();

        //COLLISIONS
        let flecheATouche = false;

        // On calcule où est la pointe de la flèche (le bout)
        //On utilise des formules de maths (cosinus/sinus) pour trouver le bout
        let pointeX = a.x + 30 * Math.cos(a.angle);
        let pointeY = a.y + 30 * Math.sin(a.angle);

        // On vérifie si la flèche touche une POMME
        for (let j = 0; j < archeriePommes.length; j++) {
            let p = archeriePommes[j];
            
            //On utilise la fonction de collision
            let contact = circRectsOverlap(p.x, p.y, p.largeur, p.hauteur, pointeX, pointeY, 8);

            //"Beginner style" : Pas de &&, on fait deux if à la suite
            if (contact == true) {
                if (flecheATouche == false) {
                    //On supprime la pomme
                    archeriePommes.splice(j, 1);
                    
                    //On augmente le score
                    score = score + 10;
                    combo = combo + 1;
                    difficulty = difficulty + 0.05;
                    
                    //On dit que la flèche a touché quelque chose pour ne pas qu'elle traverse tout
                    flecheATouche = true;
                    
                    //On arrête la boucle pour ne pas tuer 2 pommes d'un coup
                    break;
                }
            }
        }

        // Si la flèche n'a pas touché de pomme, on regarde les ÉTOILES
        if (flecheATouche == false) {
            
            for (let k = 0; k < archerieStars.length; k++) {
                let s = archerieStars[k];
                
                let contactEtoile = circRectsOverlap(s.x, s.y, s.width, s.height, pointeX, pointeY, 8);

                if (contactEtoile == true) {
                    //On supprime l'étoile
                    archerieStars.splice(k, 1);
                    
                    //Bonus plus gros
                    score = score + 20;
                    combo = combo + 2;
                    
                    flecheATouche = true;
                    break;
                }
            }
        }

        // Suppression de la flèche (sortie d'écran ou touche)
        //Remplacement des || par des if successifs
        let doitSupprimer = false;

        if (flecheATouche == true) {
            doitSupprimer = true;
        }
        if (a.x > canvas.width) {
            doitSupprimer = true;
        }
        if (a.x < 0) {
            doitSupprimer = true;
        }
        if (a.y > canvas.height) {
            doitSupprimer = true;
        }
        if (a.y < 0) {
            doitSupprimer = true;
        }

        if (doitSupprimer == true) {
            arrows.splice(i, 1);
            i = i - 1;
        }
    }
}

/** Tire une flèche vers (targetX, targetY) en coordonnées canvas (mode Archerie). */
function spawnArrow(targetX, targetY) {
    // On déclare les variables pour la destination
    let destinationX = 0;
    let destinationY = 0;

    // Remplacement des ternaires (le truc avec ?) par des IF / ELSE basiques
    //Si on a une cible précise (clic mémorisé), on l'utilise
    if (targetX != null) {
        destinationX = targetX;
    } else {
        //Sinon on vise la souris actuelle
        destinationX = mousePosition.x;
    }

    if (targetY != null) {
        destinationY = targetY;
    } else {
        destinationY = mousePosition.y;
    }

    // Position de départ (hardcodée ou variables simples)
    //On reprend les valeurs qu'on avait mises pour le corps du joueur
    let departX = player.x-220;
    let departY = player.y+30;

    // Calculs intermédiaires
    let distanceX = destinationX - departX;
    let distanceY = destinationY - departY;

    let monAngle = Math.atan2(distanceY, distanceX);

    // Création de l'objet flèche
    let nouvelleFleche = {
        x: departX,
        y: departY,
        vx: Math.cos(monAngle) * vitesseFleche,
        vy: Math.sin(monAngle) * vitesseFleche,
        width: 32,
        height: 4,
        angle: monAngle //Pas de raccourci ES6, on écrit bien clé: valeur
    };

    arrows.push(nouvelleFleche);
}

function drawArcherie() {
    ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    
    player.draw(ctx);

    //DESSIN DE L'ARC au niveau du joueur (même offset que player.draw : tête à player.x - 250)
    ctx.save();
    let centreArcX = player.x - 220; 
    let centreArcY = player.y + 30;
    let diffX = mousePosition.x - centreArcX;
    let diffY = mousePosition.y - centreArcY;
    let angleArc = Math.atan2(diffY, diffX);

    ctx.translate(centreArcX, centreArcY);
    ctx.rotate(angleArc);
    ctx.drawImage(imgArc, -20, -20, 40, 40); //On dessine centré
    ctx.restore();

    //Gestion du tir
    if (archerieClique) {
        let tempsActuel = Date.now();
        if (tempsActuel - dernierTir > delaiTir) {
            spawnArrow(archerieClique.x, archerieClique.y);
            dernierTir = tempsActuel;
        }
        archerieClique = null;
    }

    updateArcherie();
    drawScoreAndCombo();
}

function attaqueJoueur() {
    let now = Date.now();
    
    //Vérifier si le cooldown est écoulé
    if (now - lastAttackTime < attackCooldown) {
        return; //Pas encore le moment d'attaquer
    }
    
    let attackExecuted = false;
    
    if (inputStates.left) {
        //Slash orienté du côté gauche
        slashAnimations.push(new SlashAnimation(110, 370, Math.PI / 1.05));
        
        ctx.save();
        ctx.translate(105, 395);
        ctx.rotate(Math.PI / 2);
        ctx.translate(-105, -395);
        
        ctx.drawImage(epee, 35, 350, 100, 90);
        //ctx.fillStyle = "red";
        ctx.fillRect(80, 360, 10, 70);
        ctx.restore();
        attackExecuted = true;
    }
    else if (inputStates.right) {
        slashAnimations.push(new SlashAnimation(220, 370, 60*Math.PI / 30));
        
        ctx.save();
        ctx.translate(105, 395); 
        ctx.rotate(-Math.PI / 2);
        ctx.translate(-105, -395);
        
        ctx.drawImage(epee, 75, 488, 100, 85);
        //ctx.fillStyle = "red";
        ctx.fillRect(120, 495, 10, 70);
        ctx.restore();
        attackExecuted = true;
    }
    else if (inputStates.up) {
        slashAnimations.push(new SlashAnimation(220, 320, -Math.PI / 24));
        
        ctx.save();
        ctx.translate(105, 395);
        ctx.rotate(120*Math.PI / 90);
        ctx.translate(-105, -395);
        
        ctx.drawImage(epee, 65, 510, 100, 85);
        //ctx.fillStyle = "red";
        ctx.fillRect(110, 515, 10, 70);
        ctx.restore();
        attackExecuted = true;
    }
    else if (inputStates.down) {
        slashAnimations.push(new SlashAnimation(220, 450, -Math.PI / 24));
        
        ctx.save();
        ctx.translate(105, 395);
        ctx.rotate(-Math.PI / 3);
        ctx.translate(-105, -395);
        
        ctx.drawImage(epee, 85, 490, 100, 85);
        //ctx.fillStyle = "red";
        ctx.fillRect(130, 495, 10, 70);
        ctx.restore();
        attackExecuted = true;
    }
    
    //Mettre à jour le cooldown et jouer le son si une attaque a été exécutée
    if (attackExecuted) {
        lastAttackTime = now;
        slashSound.play();
    }
}



async function demarrerJeu() {
    console.log("Début du chargement...");
    
    //On attend que loadAssets ait fini (grâce à await)
    //'assetsChargés' contiendra toutes nos images prêtes à l'emploi
    let assetsChargés = await loadAssets(assetsALoader);
    
    console.log("Chargement terminé ! On assigne les variables.");

    //On remplit nos variables globales avec les images chargées
    imgMenu = assetsChargés.menu;
    fond = assetsChargés.fond;
    epee = assetsChargés.epee;
    bouclier = assetsChargés.bouclier;
    star = assetsChargés.star;
    pommeIMG = assetsChargés.pomme;
    btnBack = assetsChargés.back;
    imgArc = assetsChargés.arc;
    
    //Pour le son, c'est direct un objet Howler prêt à jouer
    slashSound = assetsChargés.slashSound;

    //MAINTENANT que tout est prêt, on lance la boucle de jeu
    Gameloop();
}

function Gameloop() {
    //1 - on efface le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    processInput();
    defineListeners();

    //2 - on dessine tous les objets du jeu en fonction de l'état du jeu
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


demarrerJeu();
   

