export default class ObjetGraphique {
    x = 0;
    y = 0;
    largeur = 5;
    hauteur = 5;

    constructor(x, y, largeur, hauteur) {
        this.x = x;
        this.y = y;
        this.largeur = largeur;
        this.hauteur = hauteur;
    }

    draw(ctx) {
        ctx.save();
        ctx.arc(this.x, this.y, this.largeur / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    moveAbsolute(x, y) {
        this.x = x;
        this.y = y;
    }
}