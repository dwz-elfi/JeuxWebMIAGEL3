import ObjetGraphique from "./objetGraphique.js";

export default class Entity extends ObjetGraphique {
    constructor(x, y, largeur, hauteur, vx = 0, vy = 0) {
        super(x, y, largeur, hauteur);
        this.vx = vx; // Vélocité en x
        this.vy = vy; // Vélocité en y
    }

    // Mettre à jour la position basée sur la vélocité
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    // Méthode draw à override dans les sous-classes
    draw(ctx, image) {
        ctx.drawImage(image, this.x, this.y, this.largeur, this.hauteur);
    }

    // Vérifier si l'entité est sortie du canvas
    isOutOfBounds(canvasWidth, canvasHeight) {
        return (
            this.x > canvasWidth ||
            this.x + this.largeur < 0 ||
            this.y > canvasHeight ||
            this.y + this.hauteur < 0
        );
    }

    // Retourner le centre de l'entité (utile pour les collisions)
    getCenter() {
        return {
            x: this.x + this.largeur / 2,
            y: this.y + this.hauteur / 2
        };
    }
}

// Classe Star qui extends Entity
export class Star extends Entity {
    constructor(x, y, largeur, hauteur, vx, vy) {
        super(x, y, largeur, hauteur, vx, vy);
    }

    draw(ctx, image) {
        ctx.drawImage(image, this.x, this.y, this.largeur, this.hauteur);
    }
}

// Classe Pomme qui extends Entity
export class pomme extends Entity {
    constructor(x, y, largeur, hauteur, vx, vy) {
        super(x, y, largeur, hauteur, vx, vy);
    }

    draw(ctx, image) {
        ctx.drawImage(image, this.x, this.y, this.largeur, this.hauteur);
    }
}
