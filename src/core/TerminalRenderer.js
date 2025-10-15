class TerminalRenderer {
    constructor(element) {
        this.element = element;
        this.virtualTerminal = null;
        this.initialized = false;
        this.activeGameCanvas = null; // To hold the canvas of the active game (e.g., DOOM)
        
        // Create virtual canvas for rendering
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'terminal-render-canvas'; // Assign a specific ID
        this.context = this.canvas.getContext('2d');
        this.primaryFont = '"Fira Code"';
        this.fontStack = `${this.primaryFont}, "FiraCode Nerd Font", "Cascadia Mono", monospace`;
        
        // Calculate DPI scale
        this.calculateDPIScale();
        
        // Wait for font to load before initializing
        document.fonts.load(`${this.getFontSize()} ${this.primaryFont}`).then(() => {
            this.initializeRenderer();
        }).catch(() => {
            console.log('Falling back to system monospace');
            this.initializeRenderer();
        });
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
        span.style.fontFamily = this.fontStack;
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
        this.canvas.width = this.virtualTerminal.columns * this.charWidth * this.dpiScale;
        this.canvas.height = this.virtualTerminal.rows * this.charHeight * this.dpiScale;
        
        // Set canvas CSS size
        this.canvas.style.width = `${this.virtualTerminal.columns * this.charWidth}px`;
        this.canvas.style.height = `${this.virtualTerminal.rows * this.charHeight}px`;
        
        // Scale the context for high DPI
        this.context.scale(this.dpiScale, this.dpiScale);
    }

    adjustTerminalSize() {
        const padding = 20; // Terminal padding
        document.documentElement.style.setProperty('--terminal-padding', `${padding}px`);
        
        this.element.style.width = `${this.canvas.width / this.dpiScale}px`;
        this.element.style.height = `${this.canvas.height / this.dpiScale}px`;
        
        // Set container size with padding
        const container = document.querySelector('.terminal-container');
        container.style.width = `${this.canvas.width / this.dpiScale + (padding * 2)}px`;
        container.style.height = `${this.canvas.height / this.dpiScale + (padding * 2)}px`;
    }

    async init() {
        // Any initialization code
        this.initialized = true;
        this.startRenderLoop();
    }

    setVirtualTerminal(terminal) {
        this.virtualTerminal = terminal;
    }

    render() {
        if (!this.virtualTerminal || !this.initialized) return;
        
        // Reset transform before clearing
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        
        // Clear canvas
        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply DPI scaling
        this.context.setTransform(this.dpiScale, 0, 0, this.dpiScale, 0, 0);
        
        // Set text properties
        this.context.font = `${this.getFontSize()} ${this.fontStack}`;
        this.context.textBaseline = 'top';
        this.context.fillStyle = '#33ff33';
        
        // Enable font smoothing
        this.context.textRendering = 'optimizeLegibility';
        this.context.imageSmoothingEnabled = false;
        
        // Render buffer
        const buffer = this.virtualTerminal.getBuffer();
        const cursor = this.virtualTerminal.getCursorPosition();
        
        for (let y = 0; y < this.virtualTerminal.rows; y++) {
            for (let x = 0; x < this.virtualTerminal.columns; x++) {
                const cell = buffer[y][x];
                
                // Draw character
                if (cell && cell.character !== ' ') {
                    this.context.fillText(
                        cell.character,
                        x * this.charWidth,
                        y * this.charHeight
                    );
                }
                
                // Draw cursor
                if (x === cursor.x && y === cursor.y && cursor.visible) {
                    this.context.fillStyle = '#33ff33';
                    this.context.fillRect(
                        x * this.charWidth,
                        y * this.charHeight,
                        this.charWidth,
                        this.charHeight
                    );
                    if (cell && cell.character !== ' ') {
                        this.context.fillStyle = '#000000';
                        this.context.fillText(
                            cell.character,
                            x * this.charWidth,
                            y * this.charHeight
                        );
                    }
                    this.context.fillStyle = '#33ff33';
                }
            }
        }
        // Update screen
        this.element.innerHTML = '';
        this.element.appendChild(this.canvas);
    }

    startRenderLoop() {
        const loop = () => {
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    setActiveGameCanvas(gameCanvas) {
        this.activeGameCanvas = gameCanvas;
        if (gameCanvas) {
            console.log('TerminalRenderer: setActiveGameCanvas called. New activeGameCanvas:', gameCanvas.id, 'Dimensions:', gameCanvas.width, 'x', gameCanvas.height);
        } else {
            console.log('TerminalRenderer: setActiveGameCanvas called. New activeGameCanvas: null');
        }
        // If CRTEffect is active, it might need to know about this change
        if (this.crtEffect && this.crtEffect.isEnabled) {
            // The CRTEffect's render loop will pick this up via getCanvas()
            // No direct call to updateTexture here, render loop handles it.
        }
    }

    getCanvas() {
        // If a game is active and has a canvas, CRTEffect should use that.
        if (this.activeGameCanvas) {
           // console.log('TerminalRenderer.getCanvas() returning activeGameCanvas:', this.activeGameCanvas.id || this.activeGameCanvas);
            return this.activeGameCanvas;
        }
        // Otherwise, use the main terminal canvas.
        //console.log('TerminalRenderer.getCanvas() returning main terminal canvas (this.canvas). ID:', this.canvas.id || 'terminal_canvas_no_id');
        return this.canvas;
    }
}
