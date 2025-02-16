class TerminalController {
    constructor(virtualTerminal, renderer) {
        this.terminal = virtualTerminal;
        this.renderer = renderer;  // Store renderer reference
        this.terminalBuffer = virtualTerminal; // Store reference to terminal buffer
        this.currentLine = '';
        this.commandHistory = [];
        this.historyIndex = null;
        this.prompt = '> '; // Simple angle bracket (U+003E)
        // Alternative options:
        // this.prompt = '$ ';  // Traditional shell prompt
        // this.prompt = '❯ ';  // Another monospace-friendly arrow
        // this.prompt = '> ';  // Simple angle bracket
        // this.prompt = '▶ ';  // Triangle pointer
        
        this.maxHistorySize = 1000; // Maximum number of commands to store
        
        // Get input element
        this.input = document.getElementById('terminal-input');
        
        this.state = 'terminal'; // Add state management: 'terminal' or 'game'
        
        this.setupInputHandler();
        
        // Display welcome message and prompt without extra newline
        this.displayWelcomeMessage();
        this.input.focus();
    }

    setupInputHandler() {
        document.addEventListener('keydown', (e) => {
            // Only handle terminal input if we're in terminal state
            if (this.state === 'terminal') {
                // Prevent default behavior for terminal control keys
                if (['ArrowUp', 'ArrowDown', 'Backspace'].includes(e.key)) {
                    e.preventDefault();
                }

                if (e.key === 'Enter') {
                    this.handleEnter();
                } else if (e.key === 'Backspace') {
                    this.handleBackspace();
                } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    this.handleCharacter(e.key);
                } else if (e.key === 'ArrowUp') {
                    this.navigateHistory('up');
                } else if (e.key === 'ArrowDown') {
                    this.navigateHistory('down');
                }
                
                // Keep input focused in terminal mode
                this.input.focus();
            }
        });
    }

    displayWelcomeMessage() {
        const banner = [
            "(¬_¬)",
            "",
            "██████  ███████ ████████ ██████  ██        ██████  ██ ██   ██ ██       █████  ",
            "██   ██ ██         ██    ██   ██ ██        ██   ██ ██ ██   ██ ██      ██   ██ ",
            "██████  █████      ██    ██████  ██        ██████  ██ ███████ ██      ███████ ",
            "██      ██         ██    ██   ██ ██        ██      ██ ██   ██ ██      ██   ██ ",
            "██      ███████    ██    ██   ██ ██        ██      ██ ██   ██ ███████ ██   ██ ",
            "                                                                           ",
            "",
            'Type "help" for available commands',
            "" // Add empty line before prompt
        ];
        
        // Write welcome message
        this.writeOutput(banner.join('\n'));
        
        // Display prompt (will be on new line)
        this.displayPrompt();
    }

    handleEnter() {
        // Get current command and immediately clear the line buffer
        const command = this.currentLine;
        this.currentLine = '';
        
        // Write a newline
        this.terminal.newLine();
        
        // Process the command if there is one
        if (command.trim()) {
            this.addToHistory(command.trim());
            this.executeCommand(command.trim());
        }
        
        // Reset history index
        this.historyIndex = null;
        
        // Show new prompt without extra newline
        this.displayPrompt();
    }

    handleBackspace() {
        if (this.currentLine.length > 0) {
            this.currentLine = this.currentLine.slice(0, -1);
            this.terminal.backspace();
            this.renderer.render();
        }
    }

    handleCharacter(char) {
        if (char.length === 1 && char.charCodeAt(0) >= 32 && this.currentLine !== null) {
            this.currentLine += char;
            this.terminal.writeCharacter(char, false);
            this.renderer.render();  // Render after writing character
        }
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        // Initialize index if it's null
        if (this.historyIndex === null) {
            this.historyIndex = this.commandHistory.length;
        }

        // Clear current line first
        while (this.currentLine.length > 0) {
            this.handleBackspace();
        }

        if (direction === 'up') {
            // Move up in history (towards older commands)
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const command = this.commandHistory[this.historyIndex];
                this.currentLine = command;
                for (const char of command) {
                    this.terminal.writeCharacter(char);
                }
            }
        } else {
            // Move down in history (towards newer commands)
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                const command = this.commandHistory[this.historyIndex];
                this.currentLine = command;
                for (const char of command) {
                    this.terminal.writeCharacter(char);
                }
            } else {
                // Clear line if we're at the end of history
                this.historyIndex = this.commandHistory.length;
                this.currentLine = '';
            }
        }
    }

    processCommand(command) {
        const [cmd, ...args] = command.split(' ');

        switch (cmd.toLowerCase()) {
            case 'help':
                this.showHelp();
                break;
            case 'clear':
                this.clearScreen();
                break;
            case 'echo':
                this.writeOutput(args.join(' ') + '\n');
                break;
            case 'whois':
                this.showWhois();
                break;
            case 'snake':
                this.startSnakeGame();
                break;
            case 'asteroids':
                this.startAsteroidsGame();
                break;
            default:
                this.writeOutput(`Command not found: ${cmd}\n`);
        }
        this.renderer.render();
    }

    showHelp() {
        const helpText = [
            'Available commands:',
            '  help      - Show this help message',
            '  clear     - Clear the terminal screen',
            '  echo      - Display the specified text',
            '  whois     - Display information about the developer',
            '  snake     - Play a game of Snake',
            '  asteroids - Play a game of Asteroids',
            ''
        ].join('\n');
        
        this.writeOutput(helpText);
    }

    showWhois() {
        const whois = [
            "Hi reader 👋",
            "I'm a Software Engineer / Developer / Wizard 🧙",
            "I tinker a lot with embedded systems, but my curiosity doesn't stop there.",
            ""
        ];
        
        this.writeOutput(whois.join('\n'));
    }

    clearScreen() {
        // Reset terminal state
        this.terminal.buffer = [];
        this.terminal.initializeBuffer();
        this.terminal.cursorX = 0;
        this.terminal.cursorY = 0;
        
        // Show prompt on clean screen
        this.displayPrompt();
    }

    displayPrompt() {
        // Write prompt characters
        for (const char of this.prompt) {
            this.terminal.writeCharacter(char);
        }
    }

    writeOutput(text) {
        const lines = text.split('\n');
        
        // Write each line with proper newline handling
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Use computerWrite for system output
            this.computerWrite(line);
            
            // Always add newline after each line
            this.terminal.newLine();
        }
    }

    computerWrite(text) {
        // Process each character with animation
        for (const char of text) {
            if (char === '\n') {
                this.terminal.newLine();
            } else if (char === ' ') {
                this.terminal.writeCharacter(' ', false);
            } else {
                this.terminal.writeCharacter(char, true);  // true enables animation
            }
        }
    }

    addToHistory(command) {
        // Add to history if it's not the same as the last command
        if (this.commandHistory.length === 0 || 
            this.commandHistory[this.commandHistory.length - 1] !== command) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > this.maxHistorySize) {
                this.commandHistory.shift();
            }
        }
        this.historyIndex = this.commandHistory.length; // Reset history index after command
    }

    executeCommand(command) {
        this.processCommand(command);
    }

    startSnakeGame() {
        // Clean the screen
        this.clearScreen();
        
        try {
            // Switch to game state
            this.state = 'game';
            
            // Create and start the game
            this.snakeGame = new SnakeGame(this.terminal);
            this.snakeGame.draw();
            
            // Disable terminal input and cursor
            this.terminal.stopCursorBlink();
            this.input.blur();
            this.input.disabled = true;
            
            // Set up game-specific keydown handler
            document.addEventListener('keydown', this.handleGameInput);
            
            // Start the game
            this.snakeGame.start();
            
        } catch (error) {
            this.writeOutput(`Error starting game: ${error.message}\n`);
            this.returnToTerminal();
        }
        
        this.renderer.render();
    }

    handleGameInput = (e) => {
        if (this.state === 'game' && 
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'r', 'R', 'Escape'].includes(e.key)) {
            e.preventDefault();
            
            if (e.key === 'Escape') {
                this.returnToTerminal();
                return;
            }
            
            this.snakeGame.handleInput(e.key);
        }
    }

    returnToTerminal() {
        // Remove game input handler
        document.removeEventListener('keydown', this.handleGameInput);
        
        // Switch back to terminal state
        this.state = 'terminal';
        
        // Re-enable terminal input and cursor
        this.terminal.startCursorBlink();
        this.input.disabled = false;
        
        if (this.snakeGame) {
            this.snakeGame.stop();
        }
        
        // Show welcome banner instead of just clearing screen
        this.terminal.initializeBuffer();
        this.displayWelcomeMessage();
        this.input.focus();
    }

    startAsteroidsGame() {
        // Clean the screen
        this.clearScreen();
        
        try {
            // Switch to game state
            this.state = 'asteroids';
            
            // Create game buffer
            const asteroidsBuffer = new AsteroidsBuffer(this.terminal.columns, this.terminal.rows);
            
            // Store current terminal setup
            this.gameBuffer = asteroidsBuffer;
            
            // Switch to game buffer
            this.renderer.setBuffer(asteroidsBuffer);
            
            // Disable terminal input and cursor
            this.terminal.stopCursorBlink();
            this.input.blur();
            this.input.disabled = true;
            
            // Set up both keydown and keyup handlers
            document.addEventListener('keydown', this.handleAsteroidsInput);
            document.addEventListener('keyup', this.handleAsteroidsInput);
            
            // Start the game loop
            this.lastFrameTime = performance.now();
            this.startGameLoop();
            
        } catch (error) {
            this.writeOutput(`Error starting game: ${error.message}\n`);
            this.returnToTerminal();
        }
    }

    handleAsteroidsInput = (e) => {
        if (this.state === 'asteroids') {
            e.preventDefault();
            
            if (e.key === 'Escape') {
                this.returnToTerminal();
                return;
            }
            
            // Pass both the key and whether it's a keydown event
            this.gameBuffer.handleInput(e.key, e.type === 'keydown');
        }
    }

    startGameLoop = () => {
        if (this.state !== 'asteroids') return;

        const currentTime = performance.now();
        const deltaTime = currentTime - (this.lastFrameTime || currentTime);
        this.lastFrameTime = currentTime;

        // Update game state
        this.gameBuffer.update(deltaTime);
        
        // Render the frame
        this.renderer.render(currentTime);
        
        // Schedule next frame
        this.gameLoopId = requestAnimationFrame(this.startGameLoop);
    }

    returnToTerminal() {
        // Remove both event listeners
        document.removeEventListener('keydown', this.handleAsteroidsInput);
        document.removeEventListener('keyup', this.handleAsteroidsInput);
        
        // Cancel game loop
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // Switch back to terminal state
        this.state = 'terminal';
        
        // Restore terminal buffer and renderer
        this.renderer.setBuffer(this.terminalBuffer);
        
        // Re-enable terminal input and cursor
        this.terminal.startCursorBlink();
        this.input.disabled = false;
        
        // Show welcome banner
        this.terminal.initializeBuffer();
        this.displayWelcomeMessage();
        this.input.focus();
    }
} 