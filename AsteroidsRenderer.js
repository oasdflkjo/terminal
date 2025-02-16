class AsteroidsRenderer extends TerminalRenderer {
    constructor() {
        super();
        this.lastRenderTime = 0;
    }

    render(currentTime) {
        if (!this.currentBuffer || !(this.currentBuffer instanceof AsteroidsBuffer)) return;

        const deltaTime = currentTime - this.lastRenderTime;
        this.lastRenderTime = currentTime;

        // Update game state
        this.currentBuffer.update(deltaTime);

        // Clear canvas
        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const gameState = this.currentBuffer.getGameState();

        // Draw player
        this.context.save();
        this.context.translate(
            gameState.player.x * this.charWidth,
            gameState.player.y * this.charHeight
        );
        this.context.rotate(gameState.player.rotation);
        this.context.strokeStyle = '#33ff33';
        this.context.beginPath();
        this.context.moveTo(-10, -10);
        this.context.lineTo(20, 0);
        this.context.lineTo(-10, 10);
        this.context.closePath();
        this.context.stroke();
        this.context.restore();

        // Draw asteroids
        gameState.asteroids.forEach(asteroid => {
            this.context.beginPath();
            this.context.strokeStyle = '#33ff33';
            this.context.arc(
                asteroid.x * this.charWidth,
                asteroid.y * this.charHeight,
                asteroid.size * 5,
                0,
                Math.PI * 2
            );
            this.context.stroke();
        });

        // Draw bullets
        gameState.bullets.forEach(bullet => {
            this.context.fillStyle = '#33ff33';
            this.context.fillRect(
                bullet.x * this.charWidth - 2,
                bullet.y * this.charHeight - 2,
                4,
                4
            );
        });

        // Draw score
        this.context.fillStyle = '#33ff33';
        this.context.font = '20px "Cascadia Mono"';
        this.context.fillText(`Score: ${gameState.score}`, 10, 30);

        if (gameState.gameOver) {
            this.context.fillStyle = '#33ff33';
            this.context.font = '40px "Cascadia Mono"';
            this.context.fillText('GAME OVER', 
                this.canvas.width/2 - 100,
                this.canvas.height/2
            );
        }
    }
} 