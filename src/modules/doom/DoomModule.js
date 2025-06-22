// filepath: c/projects/terminal/src/modules/doom/DoomModule.js
class DoomModule {
    constructor(terminalWrapper, terminalRenderer, moduleManager) {
        this.terminalWrapper = terminalWrapper;
        this.terminalRenderer = terminalRenderer;
        this.moduleManager = moduleManager;
        this.doomCanvas = null;
        this.doomScript = null;
        this.isActive = false;
        this.crtEffect = terminalRenderer.crtEffect; // Reference to CRT effect
        console.log('DoomModule initialized');
    }

    getName() {
        return 'Doom';
    }

    load() {
        // Called by ModuleManager to initialize
        console.log('DoomModule load method called');
        // We will start the game via a command
    }

    initializeDoomCanvas() {
        // Create the DOOM canvas as an offscreen element only
        this.doomCanvas = document.createElement('canvas');
        this.doomCanvas.width = this.width;
        this.doomCanvas.height = this.height;
        // Do NOT append to DOM
        // Pass the DOOM canvas to the CRT effect for compositing
        if (this.crtEffect && typeof this.crtEffect.setDoomCanvas === 'function') {
            this.crtEffect.setDoomCanvas(this.doomCanvas);
        }
        // Initialize the DOOM engine with the offscreen canvas
        this.doomEngine = new DoomEngine(this.doomCanvas);
        this.doomEngine.initialize();

        // Remove any rogue DOOM canvases from the DOM (created by the engine)
        const allCanvases = document.querySelectorAll('canvas');
        allCanvases.forEach(canvas => {
            if (canvas !== this.crtEffect.canvas && canvas !== this.doomCanvas && canvas.parentElement) {
                canvas.parentElement.removeChild(canvas);
            }
        });
    }

    startDoom() {
        if (this.isActive) {
            console.log('DOOM is already running.');
            return;
        }

        console.log('Starting DOOM...');
        this.isActive = true;

        // Create canvas for DOOM
        this.doomCanvas = document.createElement('canvas');
        this.doomCanvas.id = 'canvas';
        this.doomCanvas.width = 800;
        this.doomCanvas.height = 600;
        this.doomCanvas.style.position = 'absolute';
        this.doomCanvas.style.left = '-9999px';
        this.doomCanvas.style.top = '-9999px';

        if (this.terminalWrapper) {
            this.terminalWrapper.appendChild(this.doomCanvas);
            console.log('DOOM canvas (id=canvas) appended to terminalWrapper and positioned off-screen');
        } else {
            console.error('Cannot append DOOM canvas, terminalWrapper is null in DoomModule');
        }

        // Debug: Append DOOM canvas temporarily to verify content
        this.doomCanvas.style.position = 'relative';
        this.doomCanvas.style.left = '0';
        this.doomCanvas.style.top = '0';
        this.doomCanvas.style.zIndex = '9999';
        document.body.appendChild(this.doomCanvas);

        // Signal CRT effect to use the DOOM canvas
        if (this.crtEffect) {
            console.log('Setting DOOM canvas as source for CRT effect.');
            this.crtEffect.setSourceCanvas(this.doomCanvas);
        }

        // Configure DOOM (Emscripten Module object)
        window.Module = {
            canvas: this.doomCanvas,
            locateFile: (path) => `src/modules/doom/${path}`,
            arguments: ['-nofullscreen', '-width', '800', '-height', '600'],
            onRuntimeInitialized: () => {
                console.log('DOOM Runtime Initialized.');
                if (this.crtEffect) {
                    console.log('Resizing CRT effect for DOOM canvas.');
                    this.crtEffect.resizeCanvas();
                }
            },
            gameHasExited: (status) => {
                console.log('DOOM exited with status:', status);
                this.stopDoom();
            },
            print: (text) => { console.log('DOOM stdout:', text); },
            printErr: (text) => { console.error('DOOM stderr:', text); }
        };

        // Load chocolate-doom.js
        this.doomScript = document.createElement('script');
        this.doomScript.src = 'src/modules/doom/chocolate-doom.js';
        this.doomScript.async = true;
        document.body.appendChild(this.doomScript);

        console.log('DOOM script loading.');
    }

    stopDoom() {
        // Log entry point and current isActive state
        console.log(`>>> stopDoom called. Current isActive state: ${this.isActive} <<<`);
        
        console.log('>>> Stopping DOOM... (Inside stopDoom method START) <<<');
        this.isActive = false; // Ensure isActive is set to false

        if (this.doomCanvas) {
            if (this.doomCanvas.parentElement) {
                this.doomCanvas.parentElement.removeChild(this.doomCanvas);
                console.log('DOOM canvas (id=canvas) removed from its parent');
            }
            this.doomCanvas = null; 
            console.log('DoomModule.stopDoom(): this.doomCanvas set to null');
        } else {
            console.warn('DoomModule.stopDoom(): this.doomCanvas was already null.');
        }
        
        // Clean up the Emscripten script tag
        if (this.doomScript) {
            if (this.doomScript.parentNode) {
                this.doomScript.parentNode.removeChild(this.doomScript);
            }
            this.doomScript = null;
            console.log('DoomModule.stopDoom(): DOOM script tag removed and nulled.');
        }

        // Clear the global Module object 
        if (window.Module) {
            window.Module = undefined;
            console.log('DoomModule.stopDoom(): window.Module nulled.');
        } else {
            console.warn("DoomModule.stopDoom(): window.Module was already undefined.");
        }

        // Reset CRT effect to use the terminal canvas
        if (this.crtEffect) {
            console.log('Resetting CRT effect to use terminal canvas.');
            this.crtEffect.setSourceCanvas(this.terminalRenderer.getCanvas());
        }

        // Signal TerminalRenderer to stop using the DOOM canvas
        if (this.terminalRenderer) {
            this.terminalRenderer.setActiveGameCanvas(null); // CRITICAL STEP
            console.log('DoomModule.stopDoom(): Called setActiveGameCanvas(null)');
            
            if (this.terminalRenderer.virtualTerminal && typeof this.terminalRenderer.render === 'function') {
                console.log('DoomModule.stopDoom(): Forcing TerminalRenderer.render() to refresh terminal content');
                this.terminalRenderer.render(); // Force redraw of terminal content
            }

            if (this.terminalRenderer.crtEffect && this.terminalRenderer.crtEffect.isEnabled) {
                console.log('DoomModule.stopDoom(): Requesting CRTEffect resize/redraw');
                this.terminalRenderer.crtEffect.resizeCanvas(); 
            }
        } else {
            console.error('DoomModule.stopDoom(): this.terminalRenderer is null! Cannot reset renderer state.');
        }
        
        if (this.terminalWrapper) {
            this.terminalWrapper.classList.remove('game-mode');
            console.log('DoomModule.stopDoom(): game-mode class removed from terminalWrapper.');

            const terminalInput = this.terminalWrapper.querySelector('.terminal-input');
            if (terminalInput && typeof terminalInput.focus === 'function') {
                console.log('DoomModule.stopDoom(): Focusing terminal input.');
                terminalInput.focus();
            }

            // Reset terminal to init state
            const terminalModule = this.moduleManager ? this.moduleManager.getModule('terminal') : null;
            if (terminalModule && typeof terminalModule.resetToInitState === 'function') {
                console.log('DoomModule.stopDoom(): Resetting terminal to init state.');
                terminalModule.resetToInitState();
            } else {
                console.warn('DoomModule.stopDoom(): Could not find terminal module or resetToInitState method.');
            }
        } else {
            console.error('DoomModule.stopDoom(): this.terminalWrapper is null! Cannot remove game-mode or focus input.');
        }
        
        console.log('>>> DOOM stopped. (Inside stopDoom method END) <<<');
    }

    getCanvas() {
        return this.doomCanvas;
    }

    isGameActive() {
        return this.isActive;
    }
}

// Export the class if using ES6 modules, otherwise it's global in a script tag context
export default DoomModule; // Uncomment if your ModuleManager uses ES6 imports
