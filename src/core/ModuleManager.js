import DoomModule from '../modules/doom/DoomModule.js'; // Assuming ES6 modules

class ModuleManager {
    constructor(virtualTerminal) {
        this.terminal = virtualTerminal;
        this.terminalWrapper = document.querySelector('.terminal-wrapper');

        if (!this.terminalWrapper) {
            console.error('Critical: Terminal wrapper element with class .terminal-wrapper not found in the DOM. UI functionalities like game mode switching will fail.');
            // Depending on desired behavior, could throw error or allow modules to handle a null wrapper.
        }

        this.modules = new Map(); // Initialize as a Map
        // Pass the queried terminalWrapper to DoomModule
        this.modules.set('doom', new DoomModule(this.terminalWrapper, virtualTerminal.renderer)); // Add doom module
        this.activeModule = null;
        this.input = document.getElementById('terminal-input');
    }

    registerModule(name, moduleClass) {
        const module = new moduleClass(this.terminal, this);
        module.active = false;
        this.modules.set(name, module); // Now this will work
    }

    activateModule(name) {
        if (!this.modules.has(name)) { // Map uses .has()
            throw new Error(`Module '${name}' not found`);
        }

        const newModule = this.modules.get(name); // Map uses .get()
        
        if (this.activeModule === newModule) return;

        if (this.activeModule) {
            this.activeModule.active = false;
            if (this.activeModule.deactivate) {
                this.activeModule.deactivate();
            }
        }

        // Clear the terminal buffer on activation
        this.terminal.buffer = [];
        this.terminal.initializeBuffer();
        this.terminal.cursorX = 0;
        this.terminal.cursorY = 0;

        this.activeModule = newModule;
        this.activeModule.active = true;
        if (this.activeModule.activate) {
            this.activeModule.activate();
        }
    }

    setCursorState(enabled) {
        if (enabled) {
            this.terminal.startCursorBlink();
        } else {
            this.terminal.stopCursorBlink();
        }
    }

    setInputState(enabled) {
        this.input.disabled = !enabled;
        if (enabled) {
            this.input.focus();
        } else {
            this.input.blur();
        }
    }

    handleInput(event) {
        if (this.activeModule?.handleInput) {
            this.activeModule.handleInput(event);
        }
    }

    getModule(name) {
        return this.modules.get(name.toLowerCase()); // Map uses .get()
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleInput(e));
        this.activateModule('terminal');
    }
}

export default ModuleManager;