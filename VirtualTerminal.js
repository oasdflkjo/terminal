class VirtualTerminal {
    constructor(columns = 80, rows = 28) {
        this.columns = columns;
        this.rows = rows;
        this.buffer = [];
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorVisible = true;
        this.cursorBlinkInterval = null;
        
        this.animationQueue = [];  // Queue for character animations
        this.isAnimating = false;
        
        this.initializeBuffer();
        this.startCursorBlink();
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

    startCursorBlink() {
        if (this.cursorBlinkInterval) {
            clearInterval(this.cursorBlinkInterval);
        }
        
        this.cursorBlinkInterval = setInterval(() => {
            this.cursorVisible = !this.cursorVisible;
        }, 500);
    }

    writeCharacter(char, animate = false) {
        if (animate) {
            // Check if we need to scroll before queueing animation
            if (this.cursorY >= this.rows) {
                this.scrollUp();
            }
            this.queueCharacterAnimation(char);
            return;
        }

        // Normal instant character writing
        if (this.cursorX >= this.columns) {
            this.newLine();
        }

        if (this.cursorY >= this.rows) {
            this.scrollUp();
        }

        // Create a new object for each cell to prevent reference sharing
        this.buffer[this.cursorY][this.cursorX] = {
            character: char,
            color: '#33ff33',
            bgColor: '#000000',
            style: 'normal'
        };

        this.cursorX++;
    }

    queueCharacterAnimation(finalChar) {
        const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
        const STEPS = 5; // More steps for smoother animation
        const WAVE_DELAY = 20; // Delay between columns starting animation
        const STEP_DELAY = 30; // Delay between character changes
        
        const position = { x: this.cursorX, y: this.cursorY };
        
        // Calculate wave delay based on column position
        const waveOffset = position.x * WAVE_DELAY;
        
        // Queue animation steps for this character
        for (let i = 0; i <= STEPS; i++) {
            this.animationQueue.push({
                position: {...position},
                char: i === STEPS ? finalChar : CHARS[Math.floor(Math.random() * CHARS.length)],
                isFinal: i === STEPS,
                delay: waveOffset + (i * STEP_DELAY) // Total delay for this step
            });
        }

        // Move cursor
        this.cursorX++;
        if (this.cursorX >= this.columns) {
            this.newLine();
        }

        // Start animation if not already running
        if (!this.isAnimating) {
            this.processAnimationQueue();
        }
    }

    processAnimationQueue() {
        const currentTime = Date.now();
        
        if (!this.animationStartTime) {
            this.animationStartTime = currentTime;
        }
        
        // Process all steps that are ready to be shown
        const remainingSteps = [];
        
        for (const step of this.animationQueue) {
            if (currentTime >= this.animationStartTime + step.delay) {
                // Update buffer with current animation frame
                this.buffer[step.position.y][step.position.x] = {
                    character: step.char,
                    color: '#33ff33',
                    bgColor: '#000000',
                    style: 'normal'
                };
            } else {
                remainingSteps.push(step);
            }
        }
        
        this.animationQueue = remainingSteps;
        
        if (this.animationQueue.length > 0) {
            // Schedule next frame
            requestAnimationFrame(() => this.processAnimationQueue());
        } else {
            this.isAnimating = false;
            this.animationStartTime = null;
        }
    }

    newLine() {
        this.cursorY++;
        this.cursorX = 0;
        
        if (this.cursorY >= this.rows) {
            this.scrollUp();
        }
    }

    scrollUp() {
        // Remove first line from buffer
        this.buffer.shift();
        
        // Add new empty line at the bottom
        this.buffer.push(new Array(this.columns).fill({
            character: ' ',
            color: '#33ff33',
            bgColor: '#000000',
            style: 'normal'
        }));
        
        // Adjust cursor position
        this.cursorY = Math.min(this.cursorY, this.rows - 1);
        
        // Move all animation queue items up one line
        this.animationQueue = this.animationQueue.map(step => {
            if (step.position.y > 0) {
                return {
                    ...step,
                    position: {
                        ...step.position,
                        y: step.position.y - 1
                    }
                };
            }
            return null;
        }).filter(step => step !== null);
    }

    backspace() {
        if (this.cursorX > 0) {
            this.cursorX--;
            this.buffer[this.cursorY][this.cursorX] = {
                character: ' ',
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            };
        }
    }

    toggleCursor() {
        this.cursorVisible = !this.cursorVisible;
    }

    getBuffer() {
        return this.buffer;
    }

    getCursorPosition() {
        return {
            x: this.cursorX,
            y: this.cursorY,
            visible: this.cursorVisible
        };
    }

    stopCursorBlink() {
        if (this.cursorBlinkInterval) {
            clearInterval(this.cursorBlinkInterval);
            this.cursorBlinkInterval = null;
        }
        this.cursorVisible = false;
    }
} 