import { choixJeu, casesChoix, zoneJeu } from "./ecouteurs_centralise.js";

const canvas = document.getElementById("zoneJeu");
const ctx = canvas.getContext("2d");

canvas.width = clientWidth*ctx;
canvas.height = clientHeight*ctx;

const imgMenu = new Image();
imgMenu.src = "assets/Swords_Bravery.png";

imgMenu.onload = startLoopAllLoaded();


const fond = new Image();
fond.src = "assets/Fond.png";

fond.onload = startLoopAllLoaded();

let gameState = "MENU";

function update(x) {
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === "MENU") {
        drawMenu();
    }
    if (gameState === "JEU") {
        ctx.drawImage(fond, 0, 0, canvas.width, canvas.height);
    }
}

function loop(y) {
    const dt = t-last;
    update(dt);
    draw();
    last = t;
    requestAnimationFrame(loop);
}

function drawMenu(){
    ctx.drawImage(imgMenu, 0, 0, canvas.width, canvas.height);
    playBtn={x,y,w,h}
    ctx.fillRect(playBtn.x, playBtn.y, playBtn.w, playBtn.h);
    ctx.strokeRect(playBtn.x, playBtn.y, playBtn.w, playBtn.h);
    ctx.fillText("- PLAY -", playBtn.x+20, playBtn.y+30);
}


canvas.addEventListener("click", (e) => {});

canvas.addEventListener("mousemove", (e) => {});

getBoundingClientRect(
    canvas.width,
    rect.height
)

if (gameState === "MENU" && isInside(mx,my,playBtn)) { gameState='CHOIX'; currentBackground = imgBackgroundJeu; }




   

