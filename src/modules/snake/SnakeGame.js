class SnakeGame {
    constructor(virtualTerminal) {
        this.terminal = virtualTerminal;
        this.width = 40;  // Game area width
        this.height = 15; // Game area height
        
        // Calculate offsets to center the game
        this.offsetX = Math.floor((this.terminal.columns - (this.width + 2)) / 2);
        this.offsetY = Math.floor((this.terminal.rows - (this.height + 4)) / 2);
        
        // Snake properties
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.food = this.generateFood();
        
        this.score = 0;
        this.gameOver = false;
        this.intervalId = null;
        this.speed = 150;

        // Add face animation properties
        this.face = "(¬_¬)";
        this.glitchFaces = [
            "(¬_¬)", "(¬___¬)", "(¬_____¬)", 
            "(>_<)", "(×_×)", "(¬.¬)", 
            "(.___.)", "(-__-)", "(o___O)",
            "(¬__¬)", "(¬  ¬)", "(¬_¬)",
            "(×___×)", "(>___<)", "(¬ω¬)"
        ];
        this.glitchInterval = null;
        this.startFaceGlitch();
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.width),
                y: Math.floor(Math.random() * this.height)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }

    move() {
        if (this.gameOver) return;

        // Calculate new head position
        const head = {...this.snake[0]};
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check collision with walls
        if (head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height) {
            this.gameOver = true;
            this.draw(); // Draw the game over screen
            this.stop();
            return;
        }

        // Check collision with self
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver = true;
            this.draw(); // Draw the game over screen
            this.stop();
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check if food is eaten
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    draw() {
        // Clear the entire terminal buffer first
        this.terminal.initializeBuffer();

        // Draw border
        for (let x = 0; x < this.width + 2; x++) {
            // Top border
            this.terminal.buffer[this.offsetY][x + this.offsetX] = {
                character: x === 0 ? '┌' : (x === this.width + 1 ? '┐' : '─'),
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            };
            // Bottom border
            this.terminal.buffer[this.height + 1 + this.offsetY][x + this.offsetX] = {
                character: x === 0 ? '└' : (x === this.width + 1 ? '┘' : '─'),
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            };
        }

        // Draw side borders
        for (let y = 1; y <= this.height; y++) {
            this.terminal.buffer[y + this.offsetY][this.offsetX] = {
                character: '│',
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            };
            this.terminal.buffer[y + this.offsetY][this.width + 1 + this.offsetX] = {
                character: '│',
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            };
        }

        // Draw snake
        this.snake.forEach(segment => {
            this.terminal.buffer[segment.y + 1 + this.offsetY][segment.x + 1 + this.offsetX] = {
                character: '█',
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            };
        });

        // Draw food
        this.terminal.buffer[this.food.y + 1 + this.offsetY][this.food.x + 1 + this.offsetX] = {
            character: '●',
            color: '#33ff33',
            bgColor: '#000000',
            style: 'normal'
        };

        // Draw face in actual top-left corner of terminal (not game area)
        const faceChars = this.face.split('');
        faceChars.forEach((char, i) => {
            this.terminal.buffer[0][i] = {
                character: char,
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            };
        });

        // Draw score centered below the game area
        const scoreText = `Score: ${this.score}`;
        const scoreX = this.offsetX + Math.floor((this.width + 2 - scoreText.length) / 2);
        for (let i = 0; i < scoreText.length; i++) {
            this.terminal.buffer[this.height + 2 + this.offsetY][scoreX + i] = {
                character: scoreText[i],
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            };
        }

        if (this.gameOver) {
            // Draw game over box
            const gameOverLines = [
                '┌──────────────────┐',
                '│     GAME OVER    │',
                '│                  │',
                `│     Score: ${this.score.toString().padStart(2, ' ')}    │`,
                '│                  │',
                '│ Press R to start │',
                '│ Press ESC to quit│',
                '└──────────────────┘'
            ];

            // Calculate position to center the game over box
            const boxWidth = gameOverLines[0].length;
            const boxHeight = gameOverLines.length;
            const boxX = this.offsetX + Math.floor((this.width + 2 - boxWidth) / 2);
            const boxY = this.offsetY + Math.floor((this.height - boxHeight) / 2);

            // Draw each line of the game over box
            gameOverLines.forEach((line, i) => {
                for (let j = 0; j < line.length; j++) {
                    this.terminal.buffer[boxY + i][boxX + j] = {
                        character: line[j],
                        color: '#33ff33',
                        bgColor: '#000000',
                        style: i === 1 ? 'bold' : 'normal' // Make "GAME OVER" bold
                    };
                }
            });
        }
    }

    start() {
        this.intervalId = setInterval(() => this.move(), this.speed);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            // Clear face glitch interval
            if (this.glitchInterval) {
                clearInterval(this.glitchInterval);
                this.glitchInterval = null;
            }
            // Trigger banner reload after game stops
            if (window.terminalController) {
                window.terminalController.startBannerAnimation();
            }
        }
    }

    handleInput(key) {
        switch (key) {
            case 'ArrowUp':
                if (this.direction !== 'down') this.direction = 'up';
                break;
            case 'ArrowDown':
                if (this.direction !== 'up') this.direction = 'down';
                break;
            case 'ArrowLeft':
                if (this.direction !== 'right') this.direction = 'left';
                break;
            case 'ArrowRight':
                if (this.direction !== 'left') this.direction = 'right';
                break;
            case 'r':
            case 'R':
                if (this.gameOver) this.restart();
                break;
        }
    }

    restart() {
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.start();
    }

    startFaceGlitch() {
        // Glitch more frequently (every 500-1500ms)
        this.glitchInterval = setInterval(() => {
            if (Math.random() < 0.6) { // 60% chance to trigger glitch
                const glitchDuration = Math.random() * 300 + 100; // 100-400ms glitch
                const glitchFace = this.glitchFaces[Math.floor(Math.random() * this.glitchFaces.length)];
                this.face = glitchFace;
                
                // Sometimes chain multiple glitches
                if (Math.random() < 0.3) {
                    setTimeout(() => {
                        this.face = this.glitchFaces[Math.floor(Math.random() * this.glitchFaces.length)];
                        this.draw();
                        
                        setTimeout(() => {
                            this.face = "(¬_¬)";
                            this.draw();
                        }, glitchDuration / 2);
                    }, glitchDuration);
                } else {
                    // Reset face after glitch duration
                    setTimeout(() => {
                        this.face = "(¬_¬)";
                        this.draw();
                    }, glitchDuration);
                }
                this.draw();
            }
        }, 1000);
    }
}