// filepath: c/projects/terminal/src/modules/doom/DoomModule.js
class DoomModule {
    constructor(terminalWrapper, terminalRenderer, moduleManager) {
        this.terminalWrapper = terminalWrapper;
        this.terminalRenderer = terminalRenderer;
        this.moduleManager = moduleManager;
        this.doomCanvas = null;
        this.doomScript = null;
        this.isActive = false;
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

    startDoom() {
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
        // this.doomCanvas.style.visibility = 'hidden'; // Alternative to off-screen positioning

        if (this.terminalWrapper) {
            this.terminalWrapper.appendChild(this.doomCanvas);
            console.log('DOOM canvas (id=canvas) appended to terminalWrapper and positioned off-screen');
        } else {
            console.error('Cannot append DOOM canvas, terminalWrapper is null in DoomModule');
            // Fallback to body if terminalWrapper isn't available, though this is not ideal
            // document.body.appendChild(this.doomCanvas);
            // console.warn('DOOM canvas appended to body as fallback and hidden');
        }
        
        // CSS will control display size if needed, but CRTEffect will use intrinsic
        
        // Hide terminal elements and show DOOM canvas
        // The main terminal canvas used by CRTEffect will display DOOM
        // So, we don't append this doomCanvas directly to the body,
        // but CRTEffect will use it as a source.

        // Make the terminal wrapper aware that a game is active
        this.terminalWrapper.classList.add('game-mode');

        // Signal TerminalRenderer to use the DOOM canvas
        if (this.terminalRenderer) {
            this.terminalRenderer.setActiveGameCanvas(this.doomCanvas);
        }        // Configure DOOM (Emscripten Module object)
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
