// filepath: c/projects/terminal/src/modules/doom/DoomModule.js
class DoomModule {
    constructor(terminalWrapper, terminalRenderer) {
        this.terminalWrapper = terminalWrapper;
        this.terminalRenderer = terminalRenderer;
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
        this.isActive = true;
        console.log('Starting DOOM...');

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
        }

        // Configure DOOM (Emscripten Module object)
        window.Module = {
            canvas: this.doomCanvas,
            locateFile: (path) => {
                // Files are in src/modules/doom/
                return `src/modules/doom/${path}`;
            },
            arguments: ['-nofullscreen', '-width', '800', '-height', '600'],
            onRuntimeInitialized: () => {
                console.log('DOOM Runtime Initialized');
                // Ensure Module.canvas is the one we expect, especially if Emscripten found one by ID
                if (window.Module && window.Module.canvas && window.Module.canvas.id === 'canvas') {
                    console.log('DOOM Module.canvas is correctly our canvas#canvas');
                    window.Module.canvas.focus();
                } else {
                    console.warn('DOOM Module.canvas is NOT our canvas#canvas or does not exist. Current Module.canvas:', window.Module ? window.Module.canvas : 'Module undefined');
                }
                
                if (this.terminalRenderer && this.terminalRenderer.crtEffect) {
                    this.terminalRenderer.crtEffect.resizeCanvas(); 
                }
            },
            print: (text) => {
                console.log('DOOM stdout:', text);
            },
            printErr: (text) => {
                console.error('DOOM stderr:', text);
            },
            quit: (status, error) => {
                console.log('DOOM quit with status:', status, 'Error:', error);
                this.stopDoom();
            }
        };

        // Load chocolate-doom.js
        this.doomScript = document.createElement('script');
        this.doomScript.src = 'src/modules/doom/chocolate-doom.js';
        this.doomScript.async = true;
        document.body.appendChild(this.doomScript);

        console.log('DOOM script loading.');
    }

    stopDoom() {
        if (!this.isActive) {
            return;
        }
        this.isActive = false;
        console.log('Stopping DOOM...');

        if (this.doomCanvas && this.doomCanvas.parentElement) {
            this.doomCanvas.parentElement.removeChild(this.doomCanvas);
            console.log('DOOM canvas (id=canvas) removed from its parent');
        }

        if (window.Module && typeof window.Module.exit === 'function') {
            // Attempt a graceful exit if available, though Emscripten might not always provide/need this
            // For chocolate-doom, it might handle its own cleanup on quit.
        }
        
        // Clean up
        if (this.doomScript && this.doomScript.parentNode) {
            this.doomScript.parentNode.removeChild(this.doomScript);
        }
        this.doomScript = null;

        // No need to remove this.doomCanvas from DOM if it wasn't added directly
        // CRTEffect will stop using it.
        this.doomCanvas = null; 
        
        window.Module = undefined; // Clear the global Module object

        // Signal TerminalRenderer to stop using the DOOM canvas
        if (this.terminalRenderer) {
            this.terminalRenderer.setActiveGameCanvas(null);
        }
        
        this.terminalWrapper.classList.remove('game-mode');
        
        // Give focus back to the terminal input if it exists
        const terminalInput = this.terminalWrapper.querySelector('.terminal-input');
        if (terminalInput) {
            terminalInput.focus();
        }

        // Trigger a resize/render for CRTEffect to switch back to terminal content
        if (this.terminalRenderer && this.terminalRenderer.crtEffect) {
            this.terminalRenderer.crtEffect.resizeCanvas();
        }
        console.log('DOOM stopped.');
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
