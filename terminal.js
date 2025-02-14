class Terminal {
    constructor(columns = 80, rows = 28) {
        this.visibleColumns = 80;  // Fixed visible size
        this.visibleRows = 28;     // Fixed visible size
        this.bufferColumns = columns;
        this.bufferRows = rows;
        this.buffer = [];
        this.cursorX = 0;
        this.cursorY = 0;
        this.scrollOffset = 0;  // Track how far we've scrolled
        this.screen = document.getElementById('terminal-screen');
        this.input = document.getElementById('terminal-input');
        
        // Initialize with a fallback font first
        this.initializeBuffer();
        this.setupEventListeners();
        this.calculateCharacterDimensions();
        this.adjustTerminalSize();
        this.render();

        // Try to load the Nerd Font and recalculate if successful
        document.fonts.load('16px "FiraCode Nerd Font"').then(() => {
            this.calculateCharacterDimensions();
            this.adjustTerminalSize();
            this.updateVirtualCanvas();
            this.render();
        }).catch(() => {
            console.log('Falling back to Fira Code');
        });

        // Add cursor state
        this.cursorVisible = true;
        this.cursorBlinkInterval = null;
        
        // Start cursor blink
        this.startCursorBlink();

        // Create virtual canvas for CRT texture
        this.virtualCanvas = document.createElement('canvas');
        this.virtualContext = this.virtualCanvas.getContext('2d');
        
        // Initialize virtual canvas immediately
        this.calculateCharacterDimensions();
        this.adjustTerminalSize();
        this.updateVirtualCanvas();
        
        console.log('Terminal initialized', {
            virtualCanvas: this.virtualCanvas,
            dimensions: {
                width: this.virtualCanvas.width,
                height: this.virtualCanvas.height
            }
        });

        // Ensure input stays focused
        this.input.focus();
        document.addEventListener('click', () => {
            this.input.focus();
        });
    }

    initializeBuffer() {
        for (let y = 0; y < this.bufferRows; y++) {
            this.buffer[y] = new Array(this.bufferColumns).fill({
                character: ' ',
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            });
        }
    }

    setupEventListeners() {
        // Remove the click handler from here since we moved it to constructor
        
        // Ensure screen is fully opaque black
        this.screen.style.backgroundColor = '#000000';
        this.screen.style.opacity = '1';
    }

    writeCharacter(char) {
        if (this.cursorX >= this.bufferColumns) {
            this.newLine();
        }

        this.buffer[this.cursorY][this.cursorX] = {
            character: char,
            color: '#33ff33',
            bgColor: '#000000',
            style: 'normal'
        };

        this.cursorX++;
    }

    newLine() {
        this.cursorY++;
        this.cursorX = 0;
        
        if (this.cursorY >= this.bufferRows) {
            // Add a new row to the buffer
            this.buffer.push(new Array(this.bufferColumns).fill({
                character: ' ',
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            }));
            // Remove old rows if buffer gets too large
            if (this.buffer.length > this.bufferRows) {
                this.buffer.shift();
            }
            this.cursorY = this.bufferRows - 1;
        }
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

    render() {
        let output = '';
        const startRow = Math.max(0, this.buffer.length - this.visibleRows);
        const visibleBuffer = this.buffer.slice(startRow);
        
        // Add a wrapper div with solid background
        output = '<div style="background-color: #000000; width: 100%; height: 100%;">';
        
        while (visibleBuffer.length < this.visibleRows) {
            visibleBuffer.unshift(new Array(this.bufferColumns).fill({
                character: ' ',
                color: '#33ff33',
                bgColor: '#000000',
                style: 'normal'
            }));
        }

        // Render all visible rows
        for (let y = 0; y < this.visibleRows; y++) {
            for (let x = 0; x < this.visibleColumns; x++) {
                const cell = this.buffer[y][x];
                output += cell.character;
            }
            if (y < this.visibleRows - 1) {
                output += '\n';
            }
        }
        
        output += '</div>'; // Close the wrapper div
        this.screen.innerHTML = output;

        // Update virtual canvas after rendering
        this.updateVirtualCanvas();
        
        // Ensure input stays focused after render
        this.input.focus();
    }

    calculateCharacterDimensions() {
        const span = document.createElement('span');
        span.style.fontFamily = "'FiraCode Nerd Font', 'Fira Code', monospace";
        span.style.fontSize = getComputedStyle(document.documentElement)
            .getPropertyValue('--terminal-font-size').trim();
        span.style.visibility = 'hidden';
        // Use '#' instead of █ for more reliable monospace measurement
        span.textContent = '#';
        document.body.appendChild(span);

        // Get the exact character measurements
        const rect = span.getBoundingClientRect();
        const charWidth = Math.ceil(rect.width);  // Round up to prevent cutting
        const charHeight = Math.ceil(rect.height); // Round up to prevent cutting
        
        // Calculate the padding needed for equal spacing on all sides
        const padding = Math.ceil(charWidth / 2); // Use half character width as padding
        
        // Set the character dimensions
        document.documentElement.style.setProperty('--char-width', `${charWidth}px`);
        document.documentElement.style.setProperty('--char-height', `${charHeight}px`);
        document.documentElement.style.setProperty('--terminal-padding', `${padding}px`);

        document.body.removeChild(span);
    }

    adjustTerminalSize() {
        const container = document.querySelector('.terminal-container');
        const screen = this.screen;
        
        // Calculate exact dimensions
        const charWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--char-width'));
        const charHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--char-height'));
        
        // Calculate content dimensions exactly
        const contentWidth = this.visibleColumns * charWidth;
        const contentHeight = this.visibleRows * charHeight;
        
        // Set screen size (content area) - use exact pixel values
        screen.style.width = `${contentWidth}px`;
        screen.style.height = `${contentHeight}px`;
        screen.style.lineHeight = `${charHeight}px`; // Ensure line height matches char height exactly
        screen.style.margin = '0';  // Remove any margins
        screen.style.padding = '0'; // Remove any padding
        screen.style.display = 'block'; // Ensure block display
        
        // Set container size with padding
        const padding = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--terminal-padding'));
        container.style.width = `${contentWidth + (padding * 2)}px`;
        container.style.height = `${contentHeight + (padding * 2)}px`;
        container.style.backgroundColor = '#000000'; // Ensure container also has black background
    }

    startCursorBlink() {
        // Clear any existing interval
        if (this.cursorBlinkInterval) {
            clearInterval(this.cursorBlinkInterval);
        }
        
        // Set up cursor blink interval
        this.cursorBlinkInterval = setInterval(() => {
            this.cursorVisible = !this.cursorVisible;
            this.updateVirtualCanvas(); // Update virtual canvas on cursor blink
        }, 500);
        
        // Reset cursor state
        this.cursorVisible = true;
        this.render();
    }

    updateVirtualCanvas() {
        const charWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--char-width'));
        const charHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--char-height'));
        
        console.log('Updating virtual canvas', { charWidth, charHeight });
        
        this.virtualCanvas.width = this.visibleColumns * charWidth;
        this.virtualCanvas.height = this.visibleRows * charHeight;
        
        // Set background
        this.virtualContext.fillStyle = '#000000';
        this.virtualContext.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
        
        // Set text properties
        this.virtualContext.font = `${getComputedStyle(document.documentElement).getPropertyValue('--terminal-font-size')} "FiraCode Nerd Font"`;
        this.virtualContext.fillStyle = '#33ff33';
        
        console.log('Drawing to virtual canvas', {
            buffer: this.buffer,
            dimensions: {
                width: this.virtualCanvas.width,
                height: this.virtualCanvas.height
            }
        });
        
        // Render buffer to virtual canvas
        for (let y = 0; y < this.visibleRows; y++) {
            for (let x = 0; x < this.visibleColumns; x++) {
                const cell = this.buffer[y][x];
                if (cell.character !== ' ') {
                    this.virtualContext.fillText(
                        cell.character,
                        x * charWidth,
                        (y + 1) * charHeight - (charHeight * 0.2) // Adjust vertical alignment
                    );
                }
                // Draw cursor if needed
                if (y === this.cursorY && x === this.cursorX && this.cursorVisible) {
                    this.virtualContext.fillStyle = '#33ff33';
                    this.virtualContext.fillRect(
                        x * charWidth,
                        y * charHeight,
                        charWidth,
                        charHeight
                    );
                    if (cell.character !== ' ') {
                        this.virtualContext.fillStyle = '#000000';
                        this.virtualContext.fillText(
                            cell.character,
                            x * charWidth,
                            (y + 1) * charHeight - (charHeight * 0.2)
                        );
                    }
                    this.virtualContext.fillStyle = '#33ff33';
                }
            }
        }
    }

    // Add method to get the virtual canvas
    getVirtualCanvas() {
        return this.virtualCanvas;
    }
} 