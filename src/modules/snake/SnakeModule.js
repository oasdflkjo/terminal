class SnakeModule {
    constructor(virtualTerminal, moduleManager) {
        this.terminal = virtualTerminal;
        this.moduleManager = moduleManager;
        this.active = false;
        this.snakeGame = null;
    }

    activate() {
        try {
            // Disable terminal input and cursor for game mode
            this.moduleManager.setCursorState(false);
            this.moduleManager.setInputState(false);
            
            this.snakeGame = new SnakeGame(this.terminal);
            this.snakeGame.draw();
            this.snakeGame.start();
        } catch (error) {
            console.error('Error starting game:', error);
            this.handleEscape();
        }
    }

    deactivate() {
        if (this.snakeGame) {
            this.snakeGame.stop();
            this.snakeGame = null;
        }
    }

    handleInput(e) {
        if (!this.active) return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'r', 'R', 'Escape'].includes(e.key)) {
            e.preventDefault();
            
            if (e.key === 'Escape') {
                this.handleEscape();
                return;
            }
            
            this.snakeGame?.handleInput(e.key);
        }
    }

    handleEscape() {
        if (this.snakeGame) {
            this.snakeGame.stop();
            this.snakeGame = null;
        }
        this.moduleManager.activateModule('terminal');
    }
}

export default SnakeModule; 