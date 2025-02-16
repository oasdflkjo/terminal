class ModuleManager {
    constructor(virtualTerminal) {
        this.terminal = virtualTerminal;
        this.modules = new Map();
        this.activeModule = null;
        this.input = document.getElementById('terminal-input');
    }

    registerModule(name, module) {
        this.modules.set(name, module);
    }

    activateModule(name) {
        if (!this.modules.has(name)) {
            throw new Error(`Module '${name}' not found`);
        }

        const newModule = this.modules.get(name);
        
        if (this.activeModule === newModule) return;

        if (this.activeModule) {
            this.activeModule.deactivate();
        }

        this.activeModule = newModule;
        this.activeModule.activate();
    }

    handleInput(event) {
        if (this.activeModule) {
            this.activeModule.handleInput(event);
        }
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleInput(e));
        this.activateModule('terminal');
    }
}

export default ModuleManager; 