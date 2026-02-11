import ObjetGraphique from "./objetGraphique.js";


export default class Player extends ObjetGraphique {
    constructor(x, y, largeur, hauteur) {
        super(x, y, largeur, hauteur);
    }

    draw(ctx) {
        ctx.save();
        // cercle avec deux yeux, nez et une bouche


        // le cercle étant en mode "path" ou "buffer", on doit faire un beginPath
        // sinon ça redessine tous les cerles précédents qui sont restés dans le
        // "path" du contexte graphique (c'est-à dire dans le buffer graphique de la
        // carte graphique
        ctx.beginPath();

        //Tête du personnage
        ctx.arc(this.x-250, this.y, this.largeur / 2.5, 0, 2 * Math.PI);

        //Déplacement pour faire le corps du personnage 
        ctx.moveTo(this.x + this.largeur / 4, this.y);
        //Corps du personnage

        ctx.roundRect(this.x-275, this.y+25, this.largeur, this.largeur*1.5,this.largeur / 2);

        ctx.fillStyle = "blue";

        ctx.fill(); //dessine en forme plein tout le contenu du buffer de la
                    // carte graphique. beginPath remet à zero ce buffer.

        ctx.restore();
    }
}    