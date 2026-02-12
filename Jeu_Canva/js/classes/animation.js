// Gestion des animations de slash
class SlashAnimation {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.duration = 500; // Durée de l'animation en ms
        this.startTime = Date.now();
        this.isFinished = false;
    }

    update() {
        let elapsed = Date.now() - this.startTime;
        if (elapsed > this.duration) {
            this.isFinished = true;
        }
        return elapsed / this.duration; // Retourne un pourcentage de progression (0-1)
    }

    draw(ctx, canvas) {
        let progress = this.update();
        
        if (this.isFinished) return;

        ctx.save();
        ctx.globalAlpha = 1 - progress; // Fade out progressif
        ctx.strokeStyle = "rgba(255, 200, 0, 0.8)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Dessiner un arc de slash
        ctx.beginPath();
        ctx.arc(0, 0, 40 + progress * 30, -Math.PI / 4, Math.PI / 4);
        ctx.stroke();

        ctx.restore();
    }
}

// Gestion du sound
class SlashSound {
    constructor(soundPath) {
        this.audio = new Audio(soundPath);
        this.audio.volume = 0.5;
    }

    play() {
        // Réinitialiser et jouer
        this.audio.currentTime = 0;
        this.audio.play().catch(err => console.log("Erreur audio:", err));
    }
}

export { SlashAnimation, SlashSound };
