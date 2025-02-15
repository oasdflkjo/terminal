class TerminalRenderer {
    constructor() {
        this.currentBuffer = null;
        this.screen = document.getElementById('terminal-screen');
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        
        // Default dimensions until buffer is set
        this.columns = 80;  // Default terminal width
        this.rows = 24;     // Default terminal height
        
        this.calculateDPIScale();
        
        // Wait for font to load before initializing
        document.fonts.load(`${this.getFontSize()} "Cascadia Mono"`).then(() => {
            this.initializeRenderer();
        }).catch(() => {
            console.log('Falling back to system monospace');
            this.initializeRenderer();
        });
    }

    setBuffer(buffer) {
        this.currentBuffer = buffer;
        const dimensions = buffer.getDimensions();
        this.columns = dimensions.width;
        this.rows = dimensions.height;
        // Recalculate dimensions when buffer changes
        this.calculateCharacterDimensions();
        this.adjustTerminalSize();
    }

    calculateDPIScale() {
        // Get device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate a scale factor based on DPI
        // This ensures consistent physical size across different displays
        const scale = Math.max(1, Math.floor(dpr));
        
        // Update CSS variable
        document.documentElement.style.setProperty('--dpi-scale', scale.toString());
        
        // Store for internal use
        this.dpiScale = scale;
    }

    getFontSize() {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--terminal-font-size').trim();
    }

    initializeRenderer() {
        // Initialize dimensions
        this.calculateCharacterDimensions();
        this.adjustTerminalSize();
        
        // Start render loop
        this.startRenderLoop();
    }

    calculateCharacterDimensions() {
        const span = document.createElement('span');
        span.style.fontFamily = "'Cascadia Mono', monospace";
        span.style.fontSize = this.getFontSize();
        span.style.visibility = 'hidden';
        span.textContent = '#';
        document.body.appendChild(span);

        const rect = span.getBoundingClientRect();
        this.charWidth = Math.ceil(rect.width);
        this.charHeight = Math.ceil(rect.height * parseFloat(getComputedStyle(document.documentElement)
            .getPropertyValue('--terminal-line-height')));
        
        document.body.removeChild(span);
        
        // Set CSS variables for consistent sizing
        document.documentElement.style.setProperty('--char-width', `${this.charWidth}px`);
        document.documentElement.style.setProperty('--char-height', `${this.charHeight}px`);
        
        // Update canvas size with DPI scaling
        this.canvas.width = this.columns * this.charWidth * this.dpiScale;
        this.canvas.height = this.rows * this.charHeight * this.dpiScale;
        
        // Set canvas CSS size
        this.canvas.style.width = `${this.columns * this.charWidth}px`;
        this.canvas.style.height = `${this.rows * this.charHeight}px`;
        
        // Scale the context for high DPI
        this.context.scale(this.dpiScale, this.dpiScale);
    }

    adjustTerminalSize() {
        const padding = 20; // Terminal padding
        document.documentElement.style.setProperty('--terminal-padding', `${padding}px`);
        
        this.screen.style.width = `${this.canvas.width / this.dpiScale}px`;
        this.screen.style.height = `${this.canvas.height / this.dpiScale}px`;
        
        // Set container size with padding
        const container = document.querySelector('.terminal-container');
        container.style.width = `${this.canvas.width / this.dpiScale + (padding * 2)}px`;
        container.style.height = `${this.canvas.height / this.dpiScale + (padding * 2)}px`;
    }

    render() {
        if (!this.currentBuffer) return;

        const buffer = this.currentBuffer.getBuffer();
        const dimensions = this.currentBuffer.getDimensions();

        // Reset transform before clearing
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        
        // Clear canvas
        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply DPI scaling
        this.context.setTransform(this.dpiScale, 0, 0, this.dpiScale, 0, 0);
        
        // Set text properties
        this.context.font = `${this.getFontSize()} "Cascadia Mono"`;
        this.context.textBaseline = 'top';
        
        // Render buffer
        for (let y = 0; y < dimensions.height; y++) {
            for (let x = 0; x < dimensions.width; x++) {
                const cell = buffer[y][x];
                
                // Draw character
                if (cell && cell.character !== ' ') {
                    this.context.fillStyle = cell.color;
                    this.context.fillText(
                        cell.character,
                        x * this.charWidth,
                        y * this.charHeight
                    );
                }
            }
        }

        // Draw cursor if the buffer is a VirtualTerminal
        if (this.currentBuffer instanceof VirtualTerminal) {
            const cursor = this.currentBuffer.getCursorPosition();
            if (cursor.visible) {
                this.context.fillStyle = '#33ff33';
                this.context.fillRect(
                    cursor.x * this.charWidth,
                    cursor.y * this.charHeight,
                    this.charWidth,
                    this.charHeight
                );

                // If there's a character under the cursor, draw it in inverse
                const cell = buffer[cursor.y][cursor.x];
                if (cell && cell.character !== ' ') {
                    this.context.fillStyle = '#000000';
                    this.context.fillText(
                        cell.character,
                        cursor.x * this.charWidth,
                        cursor.y * this.charHeight
                    );
                }
            }
        }
        
        // Update screen
        this.screen.innerHTML = '';
        this.screen.appendChild(this.canvas);
    }

    startRenderLoop() {
        const loop = () => {
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    getCanvas() {
        return this.canvas;
    }
} 