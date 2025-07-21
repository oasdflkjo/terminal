// filepath: c/projects/terminal/src/modules/doom/DoomModule.js
class DoomModule {    constructor(terminalWrapper, terminalRenderer, moduleManager) {
        this.terminalWrapper = terminalWrapper;
        this.terminalRenderer = terminalRenderer;
        this.moduleManager = moduleManager;
        this.doomCanvas = null;
        this.doomScript = null;
        this.isActive = false;
        this.scriptLoaded = false; // Track if script has been loaded
        console.log('DoomModule initialized');
    }

    getName() {
        return 'Doom';
    }

    load() {
        // Called by ModuleManager to initialize
        console.log('DoomModule load method called');
        // We will start the game via a command
    }    async startDoom() {
        if (this.isActive) {
            console.log('DOOM is already running.');
            return;
        }
        // Ensure `this` is correct for the Module object callbacks
        const self = this; // Capture the correct 'this'

        console.log('Starting DOOM...');
        this.isActive = true; // Set active at the beginning of start process

        // Create canvas for DOOM
        this.doomCanvas = document.createElement('canvas');
        this.doomCanvas.id = 'canvas'; // Keep ID as 'canvas'
        this.doomCanvas.width = 800; // Intrinsic width
        this.doomCanvas.height = 600; // Intrinsic height
        
        // Position off-screen for Emscripten, CRTEffect will use it as a source
        this.doomCanvas.style.position = 'absolute';
        this.doomCanvas.style.left = '-9999px';
        this.doomCanvas.style.top = '-9999px';

        if (this.terminalWrapper) {
            this.terminalWrapper.appendChild(this.doomCanvas);
            console.log('DOOM canvas (id=canvas) appended to terminalWrapper and positioned off-screen');
        } else {
            console.error('Cannot append DOOM canvas, terminalWrapper is null in DoomModule');
        }

        // Make the terminal wrapper aware that a game is active
        this.terminalWrapper.classList.add('game-mode');
        
        // Signal TerminalRenderer to use the DOOM canvas
        if (this.terminalRenderer) {
            this.terminalRenderer.setActiveGameCanvas(this.doomCanvas);
        }

        // Configure DOOM (Emscripten Module object)
        window.Module = {
            canvas: this.doomCanvas, // Emscripten will use this
            locateFile: (path) => `src/modules/doom/${path}`,
            arguments: ['-nofullscreen', '-width', '800', '-height', '600'],
            onRuntimeInitialized: () => {
                console.log('DOOM Runtime Initialized. doomCanvas dimensions:', self.doomCanvas.width, 'x', self.doomCanvas.height);
                if (window.Module && window.Module.canvas && window.Module.canvas.id === 'canvas') {
                    console.log('DOOM Module.canvas is correctly self.doomCanvas');
                } else {
                    console.warn('DOOM Module.canvas is NOT self.doomCanvas or does not exist. Current Module.canvas:', window.Module ? window.Module.canvas : 'Module undefined');
                }
                
                if (self.terminalRenderer && self.terminalRenderer.crtEffect) {
                    self.terminalRenderer.crtEffect.resizeCanvas(); 
                }
            },
            gameHasExited: function(status) {
                console.log('**************************************************');
                console.log('****** gameHasExited CALLED! Status:', status, '******');
                console.log('**************************************************');
                // Call our stopDoom function to reset the terminal view
                self.stopDoom();
            },
            print: (text) => { console.log('DOOM stdout:', text); },
            printErr: (text) => { console.error('DOOM stderr:', text); }
        };

        // Load the DOOM script - no need for complex cleanup since we'll refresh on exit
        this.doomScript = document.createElement('script');
        this.doomScript.src = 'src/modules/doom/chocolate-doom.js';
        this.doomScript.async = true;
        this.doomScript.onload = () => {
            console.log('DOOM script loaded successfully');
            this.scriptLoaded = true;
        };
        this.doomScript.onerror = () => {
            console.error('Failed to load DOOM script');
            this.isActive = false;
        };
        
        document.body.appendChild(this.doomScript);
        console.log('DOOM script loading...');
    }stopDoom() {
        // Log entry point and current isActive state
        console.log(`>>> stopDoom called. Current isActive state: ${this.isActive} <<<`);
        
        console.log('>>> Stopping DOOM... (Inside stopDoom method START) <<<');
        this.isActive = false; // Ensure isActive is set to false

        // Simple solution: just refresh the page to clear all Emscripten globals
        // This is much more reliable than trying to manually clean up the complex state
        console.log('Refreshing page to cleanly exit DOOM...');
        window.location.reload();
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
