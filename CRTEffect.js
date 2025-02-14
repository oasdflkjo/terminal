class CRTEffect {
    constructor(canvas, terminalRenderer) {
        // Build flag - set to false to disable CRT effect
        this.CRT_ENABLED = true;
        
        if (!this.CRT_ENABLED) return;
        
        console.log('CRTEffect constructor', { canvas, terminalRenderer });
        this.canvas = canvas;
        this.renderer = terminalRenderer;
        
        // Initial setup
        this.resizeCanvas();
        
        // Add resize listener
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.gl = canvas.getContext('webgl');
        this.isEnabled = true;
        this.animationFrame = null;
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        // Shader for CRT effect
        this.vertexShaderSource = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            varying vec2 vTextureCoord;
            void main() {
                gl_Position = vec4(aVertexPosition, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
        `;

        this.fragmentShaderSource = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float uTime;
            
            // Add noise function
            float rand(vec2 co) {
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }
            
            void main() {
                vec2 uv = vTextureCoord;
                
                // Enhanced CRT curvature
                vec2 curved = uv * 2.0 - 1.0;
                vec2 offset = curved.yx / 3.0;  // Reduced curvature from 2.5 to 3.0
                curved += curved * offset * offset;
                curved = curved * 0.5 + 0.5;
                
                // Adjust screen bounds
                curved = mix(uv, curved, 0.82);  // Slightly reduced curve effect from 0.85
                
                // Enhanced scanlines with more pronounced effect
                float scanline = sin(curved.y * 800.0) * 0.15;  // Increased frequency and intensity
                float horizontalScan = sin(curved.y * 400.0 + uTime * 2.0) * 0.03;
                
                // Subtle vertical sync effect
                float verticalSync = sin(uTime * 0.2) * 0.003 * sin(curved.y * 10.0);
                curved.x += verticalSync;
                
                // Sample texture with curved coordinates
                vec4 color = texture2D(uSampler, curved);
                
                // Apply scanlines and other effects
                float scanIntensity = 0.85 + scanline + horizontalScan;
                color.rgb *= scanIntensity;
                
                // More pronounced screen glare
                vec2 glarePos = vec2(0.7, 0.2);  // Moved slightly more to the left
                float glareSize = 0.6;  // Smaller size for more defined glare
                float glarePower = 0.25;  // Significantly increased visibility
                
                float glareDistance = length((uv - glarePos) * vec2(1.6, 1.0));  // Less stretched
                float glare = smoothstep(glareSize, 0.0, glareDistance);
                glare *= glarePower;
                
                // Stronger phosphor glow
                color.rgb += vec3(0.15, 0.25, 0.15) * glare;  // Much stronger glow
                color.g *= 1.2;  // Stronger green boost
                color.rb *= 0.85;  // More color tinting
                
                // Add subtle noise
                float noise = rand(uv + uTime) * 0.02 - 0.01;
                color.rgb += noise;
                
                // Enhanced vignette effect
                float vignette = length(curved * 2.0 - 1.0);
                vignette = 0.5 + 0.5 * pow(0.98 - vignette * 0.4, 2.0);  // Stronger vignette
                color.rgb *= vignette;
                
                // Enhanced interlacing
                float interlace = mod(gl_FragCoord.y + uTime * 240.0, 2.0);
                color.rgb *= 0.95 + 0.05 * interlace;  // More pronounced interlacing
                
                // Brightness boost
                color.rgb *= 1.3;  // Increased overall brightness
                
                // Edge mask
                if (curved.x < 0.0 || curved.x > 1.0 || curved.y < 0.0 || curved.y > 1.0) {
                    color = vec4(0.0, 0.0, 0.0, 1.0);
                }
                
                gl_FragColor = color;
            }
        `;

        this.initShaders();
        this.initBuffers();
        this.createTexture();
        
        // Start in CRT mode
        const wrapper = document.querySelector('.terminal-wrapper');
        wrapper.classList.add('crt-mode');  // Add CRT mode class immediately
        
        // Start the effect after initialization
        requestAnimationFrame(() => {
            this.resizeCanvas();
            this.start();
        });
    }

    resizeCanvas() {
        if (!this.CRT_ENABLED) return;
        // Get the actual terminal container size
        const terminalContainer = document.querySelector('.terminal-container');
        const containerRect = terminalContainer.getBoundingClientRect();
        
        // Set canvas element size (what's visible on screen)
        this.canvas.style.width = `${containerRect.width}px`;
        this.canvas.style.height = `${containerRect.height}px`;
        
        // Set internal buffer size with fixed 1.25x multiplier
        
        this.canvas.width = containerRect.width * window.devicePixelRatio;
        this.canvas.height = containerRect.height * window.devicePixelRatio;
        
        // Update WebGL viewport if context exists
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        const wrapper = document.querySelector('.terminal-wrapper');
        const toggleBtn = document.querySelector('.crt-toggle');
        
        if (this.isEnabled) {
            wrapper.classList.add('crt-mode');
            toggleBtn.textContent = 'Disable CRT Mode';
            this.resizeCanvas();
            this.start();
        } else {
            wrapper.classList.remove('crt-mode');
            toggleBtn.textContent = 'Enable CRT Mode';
            this.stop();
        }
    }

    start() {
        if (!this.animationFrame) {
            this.render();
        }
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    initShaders() {
        // Create shader program
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);
        
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize shader program');
            return;
        }

        this.gl.useProgram(this.program);
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    initBuffers() {
        // Create vertex buffer for a fullscreen quad
        const positions = [
            -1.0,  1.0,
             1.0,  1.0,
            -1.0, -1.0,
             1.0, -1.0,
        ];

        const textureCoords = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
        ];

        // Set up position buffer
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        // Set up texture coordinate buffer
        this.textureCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
    }

    createTexture() {
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }

    async updateTexture() {
        // Use renderer's canvas as texture source
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            this.renderer.getCanvas()
        );
    }

    async render() {
        if (!this.CRT_ENABLED) return;
        console.log('Rendering CRT effect');
        // Wait for texture update to complete
        await this.updateTexture();
        
        // Clear canvas
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Set viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Set up attribute locations
        const positionLocation = this.gl.getAttribLocation(this.program, 'aVertexPosition');
        const texcoordLocation = this.gl.getAttribLocation(this.program, 'aTextureCoord');

        // Set up position attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Set up texture coordinate attribute
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
        this.gl.enableVertexAttribArray(texcoordLocation);
        this.gl.vertexAttribPointer(texcoordLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Use shader program
        this.gl.useProgram(this.program);
        
        // Update time uniform for animation effects
        const timeLocation = this.gl.getUniformLocation(this.program, 'uTime');
        this.gl.uniform1f(timeLocation, performance.now() / 1000.0);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        // Request next frame only if enabled
        if (this.isEnabled) {
            this.animationFrame = requestAnimationFrame(() => this.render());
        }
    }
} 