class TerminalModule {
    constructor(virtualTerminal, moduleManager) {
        this.terminal = virtualTerminal;
        this.moduleManager = moduleManager;
        this.active = false;
        this.currentLine = '';
        this.commandHistory = [];
        this.historyIndex = null;
        this.prompt = '> ';
        this.maxHistorySize = 10;
    }

    activate() {
        this.moduleManager.setCursorState(true);
        this.moduleManager.setInputState(true);
        this.displayWelcomeMessage();
    }

    handleInput(e) {
        if (!this.active) return;

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

        this.moduleManager.input.focus();
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
            ""
        ];
        
        this.writeOutput(banner.join('\n'));
        this.displayPrompt();
    }

    handleEnter() {
        const command = this.currentLine;
        this.currentLine = '';
        
        this.terminal.newLine();
        
        if (command.trim()) {
            this.addToHistory(command.trim());
            this.processCommand(command.trim());
        }
        
        this.historyIndex = null;
        this.displayPrompt();
    }

    handleBackspace() {
        if (this.currentLine.length > 0) {
            this.currentLine = this.currentLine.slice(0, -1);
            this.terminal.backspace();
        }
    }

    handleCharacter(char) {
        if (char.length === 1 && char.charCodeAt(0) >= 32 && this.currentLine !== null) {
            this.currentLine += char;
            this.terminal.writeCharacter(char, false);
        }
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        if (this.historyIndex === null) {
            this.historyIndex = this.commandHistory.length;
        }

        while (this.currentLine.length > 0) {
            this.handleBackspace();
        }

        if (direction === 'up') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const command = this.commandHistory[this.historyIndex];
                this.currentLine = command;
                for (const char of command) {
                    this.terminal.writeCharacter(char);
                }
            }
        } else {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                const command = this.commandHistory[this.historyIndex];
                this.currentLine = command;
                for (const char of command) {
                    this.terminal.writeCharacter(char);
                }
            } else {
                this.historyIndex = this.commandHistory.length;
                this.currentLine = '';
            }
        }
    }

    showHelp() {
        const helpText = [
            'Available commands:',
            '  help    - Show this help message',
            '  clear   - Clear the terminal screen',
            '  echo    - Display the specified text',
            '  whois   - Display information about the developer',
            '  snake   - Play a game of Snake',
            '  fdoom   - FREEDOOM!',
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
        this.terminal.buffer = [];
        this.terminal.initializeBuffer();
        this.terminal.cursorX = 0;
        this.terminal.cursorY = 0;
    }

    resetToInitState() {
        console.log('TerminalModule: Resetting to init state');
        // Clear terminal screen
        this.clearScreen();
        
        // Reset terminal module state
        this.currentLine = '';
        this.historyIndex = null;
        
        // Re-display welcome message and prompt
        this.displayWelcomeMessage();
        
        // Ensure terminal module is active
        this.active = true;
        
        // Make sure input is focused
        if (this.moduleManager && this.moduleManager.input) {
            this.moduleManager.input.focus();
        }
    }

    displayPrompt() {
        for (const char of this.prompt) {
            this.terminal.writeCharacter(char);
        }
    }

    writeOutput(text) {
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            this.computerWrite(line);
            this.terminal.newLine();
        }
    }

    computerWrite(text) {
        for (const char of text) {
            if (char === '\n') {
                this.terminal.newLine();
            } else if (char === ' ') {
                this.terminal.writeCharacter(' ', false);
            } else {
                this.terminal.writeCharacter(char, true);
            }
        }
    }

    addToHistory(command) {
        if (this.commandHistory.length === 0 || 
            this.commandHistory[this.commandHistory.length - 1] !== command) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > this.maxHistorySize) {
                this.commandHistory.shift();
            }
        }
        this.historyIndex = this.commandHistory.length;
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
                this.moduleManager.activateModule('snake');
                break;            case 'doom':
                const doomModule = this.moduleManager.getModule('doom');
                if (doomModule) {
                    if (args[0] === 'stop') {
                        doomModule.stopDoom();
                        this.writeOutput('DOOM module stopped.');
                    } else {
                        this.writeOutput('Starting DOOM...');
                        // Handle async startDoom method
                        doomModule.startDoom().catch(error => {
                            console.error('Error starting DOOM:', error);
                            this.writeOutput('Error starting DOOM: ' + error.message);
                        });
                    }
                } else {
                    this.writeOutput('Error: DOOM module not found.');
                }
                break;
            default:
                this.writeOutput(`Command not found: ${cmd}\n`);
        }
    }
}

export default TerminalModule;