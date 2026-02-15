
let inputStates = {};

/** Position de la souris dans les coordonnées du canvas (pour le bouclier en mode Défense). */
let mousePosition = { x: 0, y: 0 };

function defineListeners() {
    console.log("Définition des écouteurs d'événements");
    // Ecouteurs pour le clavier
    document.onkeydown = (event) => {
        console.log("Touche appuyée : " + event.key);

        if (event.key === "ArrowLeft") {
            inputStates.left = true;
        } else if (event.key === "ArrowRight") {
            inputStates.right = true;
        } else if (event.key === "ArrowUp") {
            inputStates.up = true;
        } else if (event.key === "ArrowDown") {
            inputStates.down = true;
        } else if (event.key === " ") {
            inputStates.space = true;
        }
    };

    // keyup
    document.onkeyup = (event) => {
        console.log("Touche relâchée : " + event.key);

        if (event.key === "ArrowLeft") {
            inputStates.left = false;
        } else if (event.key === "ArrowRight") {
            inputStates.right = false;
        } else if (event.key === "ArrowUp") {
            inputStates.up = false;
        } else if (event.key === "ArrowDown") {
            inputStates.down = false;
        } else if (event.key === " ") {
            inputStates.space = false;
        }
    };
}

/**
 * Initialise les écouteurs sur le canvas (clic, mouvement de souris).
 * À appeler une seule fois au démarrage avec le contexte du jeu.
 * @param {Object} gameContext - { canvas, getGameState, setGameState, playBtn, choix, backBtn, isInside, getHoveredItem, setHoveredItem }
 */
function initCanvasListeners(gameContext) {
    const canvas = gameContext.canvas;
    if (!canvas) return;

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left - 13, y: e.clientY - rect.top + 14 };
        const pos2 = { x: e.clientX - rect.left - 50, y: e.clientY + 2 - rect.top };
        const back = { x: 10, y: 35, w: 45, h: 35 };

        if (gameContext.getGameState() === "MENU" && gameContext.isInside(pos, gameContext.playBtn)) {
            gameContext.setGameState("CHOIX");
            return;
        }
        if (gameContext.getGameState() === "CHOIX") {
            gameContext.choix.forEach((item) => {
                if (gameContext.isInside(pos2, item)) {
                    if (item.label === "Combat") gameContext.setGameState("COMBAT");
                    if (item.label === "Defense") gameContext.setGameState("DEFENSE");
                    if (item.label === "Archerie") gameContext.setGameState("ARCHERIE");
                }
            });
            return;
        }
        if (
            (gameContext.getGameState() === "COMBAT" ||
                gameContext.getGameState() === "DEFENSE" ||
                gameContext.getGameState() === "ARCHERIE") &&
            gameContext.isInside(pos, back)
        ) {
            gameContext.setGameState("CHOIX");
        }

        if (gameContext.getHoveredItem()) {
            canvas.style.cursor = "pointer";
        } else {
            canvas.style.cursor = "default";
        }
    });

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left - 13, y: e.clientY - rect.top + 14 };
        const pos2 = { x: e.clientX - rect.left - 50, y: e.clientY + 2 - rect.top };
        const backBtnHover = { x: 10, y: 35, w: 45, h: 35 };

        // Toujours mettre à jour la position souris (pour le bouclier en mode Défense)
        mousePosition.x = e.clientX - rect.left;
        mousePosition.y = e.clientY - rect.top;

        gameContext.setHoveredItem(null);
        if (gameContext.getGameState() === "MENU" && gameContext.isInside(pos, gameContext.playBtn)) {
            gameContext.setHoveredItem(pos);
        }
        if (gameContext.getGameState() === "CHOIX") {
            gameContext.choix.forEach((item) => {
                if (gameContext.isInside(pos2, item)) {
                    gameContext.setHoveredItem(item);
                }
            });
        } else if (
            (gameContext.getGameState() === "COMBAT" ||
                gameContext.getGameState() === "DEFENSE" ||
                gameContext.getGameState() === "ARCHERIE") &&
            gameContext.isInside(pos, backBtnHover)
        ) {
            gameContext.setHoveredItem(gameContext.backBtn);
        }

        if (gameContext.getHoveredItem()) {
            canvas.style.cursor = "pointer";
        } else {
            canvas.style.cursor = "default";
        }
    });
}

export { defineListeners, inputStates, initCanvasListeners, mousePosition };
