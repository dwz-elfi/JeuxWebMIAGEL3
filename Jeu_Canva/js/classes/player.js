import ObjetGraphique from "./objetGraphique.js";


export default class Player extends ObjetGraphique {
    constructor(x, y, largeur, hauteur) {
        super(x, y, largeur, hauteur);
        this.color = "blue";
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

        ctx.fillStyle = this.color;

        ctx.fill(); //dessine en forme plein tout le contenu du buffer de la
                    // carte graphique. beginPath remet à zero ce buffer.

        ctx.restore();
    }
    //Dessin pour le jeu de défense, le personnage se trouve au millieu et non sur la gauche
    draw2(ctx){
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.largeur / 2.5, 0, 2 * Math.PI);
        ctx.roundRect(this.x-25, this.y+25, this.largeur, this.largeur*1,this.largeur / 3);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}    