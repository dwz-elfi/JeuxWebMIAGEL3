
let inputStates = {};

function defineListeners() {
    //console.log("Définition des écouteurs d'événements");
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

export { defineListeners, inputStates };