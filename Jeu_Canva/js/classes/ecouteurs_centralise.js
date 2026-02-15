/**
 * Écouteurs centralisés : ne fait qu'enregistrer les événements (clavier, clic, souris)
 * et exposer les données. La logique du jeu reste dans index.js.
 */

let inputStates = {};

/** Dernier clic (coordonnées client), consommé par le jeu à chaque frame. */
let pendingClick = null;

/** Position de la souris en coordonnées canvas (mise à jour à chaque mousemove). */
let mousePosition = { x: 0, y: 0 };

function defineListeners() {
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
 * Initialise les écouteurs sur le canvas (clic, mouvement).
 * Ne reçoit que l'élément canvas : enregistre les événements et met à jour
 * pendingClick et mousePosition. La logique (menu, curseur) est gérée dans index.js.
 * @param {HTMLCanvasElement} canvas
 */
function initCanvasListeners(canvas) {
    if (!canvas) return;

    canvas.addEventListener("click", (e) => {
        pendingClick = { clientX: e.clientX, clientY: e.clientY };
    });

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mousePosition.x = e.clientX - rect.left;
        mousePosition.y = e.clientY - rect.top;
    });
}

/**
 * Récupère le dernier clic (coordonnées client) et le retire.
 * @returns {{ clientX: number, clientY: number } | null}
 */
function getAndConsumeClick() {
    const click = pendingClick;
    pendingClick = null;
    return click;
}

export { defineListeners, inputStates, initCanvasListeners, mousePosition, getAndConsumeClick };
