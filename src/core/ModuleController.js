class ModuleController {
    constructor(virtualTerminal) {
        this.terminal = virtualTerminal;
        this.active = false;
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    handleInput(event) {
        // Override in child classes
    }
}

export default ModuleController; 