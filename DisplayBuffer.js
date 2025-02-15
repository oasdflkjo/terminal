class DisplayBuffer {
    constructor(columns, rows) {
        this.columns = columns;
        this.rows = rows;
        this.buffer = [];
        this.initializeBuffer();
    }

    initializeBuffer() {
        for (let y = 0; y < this.rows; y++) {
            this.buffer[y] = new Array(this.columns).fill({
                character: ' ',
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            });
        }
    }

    getBuffer() {
        return this.buffer;
    }

    getDimensions() {
        return {
            width: this.columns,
            height: this.rows
        };
    }
}

// Terminal-specific buffer
class TerminalBuffer extends DisplayBuffer {
    constructor(columns, rows) {
        super(columns, rows);
        this.cursorX = 0;
        this.cursorY = 0;
    }

    writeCharacter(char, x, y) {
        if (x >= 0 && x < this.columns && y >= 0 && y < this.rows) {
            this.buffer[y][x] = {
                character: char,
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            };
        }
    }
}

// Game-specific buffer
class GameBuffer extends DisplayBuffer {
    constructor(columns, rows) {
        super(columns, rows);
        this.gameState = null;
    }

    updateFromGameState(gameState) {
        this.gameState = gameState;
        // Convert game state to buffer representation
        this.renderGameState();
    }

    renderGameState() {
        // Implementation depends on specific game
        if (this.gameState) {
            // Convert game objects to character buffer
        }
    }
} 