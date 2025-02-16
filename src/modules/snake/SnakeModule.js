import ModuleController from '../../core/ModuleController.js';

class SnakeModule extends ModuleController {
    constructor(virtualTerminal, moduleManager) {
        super(virtualTerminal);
        this.moduleManager = moduleManager;
        this.snakeGame = null;
    }

    activate() {
        super.activate();
        
        // Clear the terminal buffer
        this.terminal.buffer = [];
        this.terminal.initializeBuffer();
        this.terminal.cursorX = 0;
        this.terminal.cursorY = 0;
        
        try {
            this.snakeGame = new SnakeGame(this.terminal);
            this.snakeGame.draw();
            
            this.terminal.stopCursorBlink();
            this.moduleManager.input.blur();
            this.moduleManager.input.disabled = true;
            
            this.snakeGame.start();
        } catch (error) {
            console.error('Error starting game:', error);
            this.handleEscape();  // Use the new method for error cases
        }
    }

    deactivate() {
        super.deactivate();
        
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
        // First stop the game and clean up
        if (this.snakeGame) {
            this.snakeGame.stop();
            this.snakeGame = null;
        }
        
        // Clear the screen before transitioning
        this.terminal.buffer = [];
        this.terminal.initializeBuffer();
        this.terminal.cursorX = 0;
        this.terminal.cursorY = 0;
        
        // Let the module manager handle the transition
        if (this.moduleManager) {
            this.moduleManager.activateModule('terminal');
        }
    }
}

export default SnakeModule; 