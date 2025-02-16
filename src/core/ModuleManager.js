class ModuleManager {
    constructor(virtualTerminal) {
        this.terminal = virtualTerminal;
        this.modules = new Map();
        this.activeModule = null;
        this.input = document.getElementById('terminal-input');
    }

    registerModule(name, moduleClass) {
        const module = new moduleClass(this.terminal, this);
        module.active = false;
        this.modules.set(name, module);
    }

    activateModule(name) {
        if (!this.modules.has(name)) {
            throw new Error(`Module '${name}' not found`);
        }

        const newModule = this.modules.get(name);
        
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

    init() {
        document.addEventListener('keydown', (e) => this.handleInput(e));
        this.activateModule('terminal');
    }
}

export default ModuleManager; 