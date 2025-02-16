class AsteroidsBuffer extends DisplayBuffer {
    constructor(columns, rows) {
        super(columns, rows);
        
        // Define game space dimensions (normalized coordinates)
        this.GAME_WIDTH = 100;
        this.GAME_HEIGHT = 100;
        
        // Define collision sizes to match visual sizes
        this.SHIP_DIMENSIONS = {
            width: 3,    // -1.5 to +1.5 from center
            height: 2    // -1 to +1 from center
        };
        this.PLAYER_SIZE = 1.5;  // Collision radius matches ship size
        this.BULLET_SIZE = 0.3;  // Small bullet hitbox
        this.ASTEROID_SIZES = {
            LARGE: 4,    // Match visual size
            MEDIUM: 2,
            SMALL: 1
        };
        
        this.resetGame();
    }

    resetGame() {
        this.gameState = {
            player: {
                x: this.GAME_WIDTH / 2,
                y: this.GAME_HEIGHT / 2,
                rotation: 0,
                velocity: { x: 0, y: 0 },
                size: 2,
                input: {
                    left: false,
                    right: false,
                    thrust: false
                }
            },
            asteroids: [],
            bullets: [],
            score: 0,
            gameOver: false,
            paused: false
        };
        
        // Game constants
        this.ROTATION_SPEED = 1.7;
        this.THRUST_POWER = 0.04;
        this.MAX_VELOCITY = 0.2;
        this.FRICTION = 0.995;
        this.BULLET_SPEED = 0.8;
        this.ASTEROID_SPEED = 0.02;
        
        this.initializeAsteroids();
    }

    initializeAsteroids() {
        for (let i = 0; i < 5; i++) {
            let x, y;
            do {
                x = Math.random() * this.GAME_WIDTH;
                y = Math.random() * this.GAME_HEIGHT;
            } while (Math.abs(x - this.GAME_WIDTH/2) < 20 && 
                     Math.abs(y - this.GAME_HEIGHT/2) < 20);

            this.gameState.asteroids.push({
                x: x,
                y: y,
                size: this.ASTEROID_SIZES.LARGE,
                velocity: {
                    x: (Math.random() - 0.5) * this.ASTEROID_SPEED,
                    y: (Math.random() - 0.5) * this.ASTEROID_SPEED
                },
                rotation: Math.random() * Math.PI * 2,
                generation: 0
            });
        }
    }

    wrapCoordinate(value, max) {
        return ((value % max) + max) % max;
    }

    update(deltaTime) {
        if (this.gameState.gameOver || this.gameState.paused) return;

        const dt = deltaTime / 1000;

        // Handle rotation
        if (this.gameState.player.input.left) {
            this.gameState.player.rotation -= this.ROTATION_SPEED * dt * Math.PI;
        }
        if (this.gameState.player.input.right) {
            this.gameState.player.rotation += this.ROTATION_SPEED * dt * Math.PI;
        }
        if (this.gameState.player.input.thrust) {
            // Simple thrust calculation
            const thrustX = Math.cos(this.gameState.player.rotation) * this.THRUST_POWER;
            const thrustY = Math.sin(this.gameState.player.rotation) * this.THRUST_POWER;
            
            const newVelX = this.gameState.player.velocity.x + thrustX;
            const newVelY = this.gameState.player.velocity.y + thrustY;
            
            // Simple speed calculation
            const speed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
            
            if (speed <= this.MAX_VELOCITY) {
                this.gameState.player.velocity.x = newVelX;
                this.gameState.player.velocity.y = newVelY;
            }
        }

        // Update positions
        this.gameState.player.x += this.gameState.player.velocity.x * dt * 60;
        this.gameState.player.y += this.gameState.player.velocity.y * dt * 60;

        // Apply friction
        this.gameState.player.velocity.x *= this.FRICTION;
        this.gameState.player.velocity.y *= this.FRICTION;

        // Wrap around screen using game space dimensions
        this.gameState.player.x = this.wrapCoordinate(this.gameState.player.x, this.GAME_WIDTH);
        this.gameState.player.y = this.wrapCoordinate(this.gameState.player.y, this.GAME_HEIGHT);

        // Update asteroids with game space wrapping
        this.gameState.asteroids.forEach(asteroid => {
            asteroid.x = this.wrapCoordinate(asteroid.x + asteroid.velocity.x * dt * 60, this.GAME_WIDTH);
            asteroid.y = this.wrapCoordinate(asteroid.y + asteroid.velocity.y * dt * 60, this.GAME_HEIGHT);
        });

        // Update bullets
        this.gameState.bullets = this.gameState.bullets.filter(bullet => {
            bullet.x += bullet.velocity.x * dt * 60;
            bullet.y += bullet.velocity.y * dt * 60;
            bullet.timeLeft -= deltaTime;
            
            // Check collision with asteroids
            this.gameState.asteroids.forEach((asteroid, index) => {
                if (this.checkCollision(bullet, asteroid)) {
                    this.gameState.asteroids.splice(index, 1);
                    this.gameState.score += 100;
                    if (asteroid.size > 2) {
                        this.splitAsteroid(asteroid);
                    }
                    return false;
                }
            });
            
            return bullet.timeLeft > 0;
        });

        // Check player collision with asteroids
        this.gameState.asteroids.forEach(asteroid => {
            if (this.checkCollision(this.gameState.player, asteroid)) {
                this.gameState.gameOver = true;
            }
        });
    }

    handleInput(key, isKeyDown = true) {
        if (this.gameState.gameOver) {
            if (key === 'r' || key === 'R') {
                this.resetGame();
            }
            return;
        }

        // Update input state
        switch (key) {
            case 'ArrowLeft':
                this.gameState.player.input.left = isKeyDown;
                break;
            case 'ArrowRight':
                this.gameState.player.input.right = isKeyDown;
                break;
            case 'ArrowUp':
                this.gameState.player.input.thrust = isKeyDown;
                break;
            case ' ': // Space to shoot
                if (isKeyDown) this.shoot();
                break;
        }
    }

    shoot() {
        const BULLET_SPEED = this.BULLET_SPEED;
        const SHIP_LENGTH = 1.5;
        
        // Simple bullet velocity
        const bulletVelX = Math.cos(this.gameState.player.rotation) * BULLET_SPEED;
        const bulletVelY = Math.sin(this.gameState.player.rotation) * BULLET_SPEED;
        
        const tipX = this.gameState.player.x + Math.cos(this.gameState.player.rotation) * SHIP_LENGTH;
        const tipY = this.gameState.player.y + Math.sin(this.gameState.player.rotation) * SHIP_LENGTH;
        
        this.gameState.bullets.push({
            x: tipX,
            y: tipY,
            velocity: {
                x: bulletVelX,
                y: bulletVelY
            },
            timeLeft: 700,
            size: this.BULLET_SIZE
        });
    }

    splitAsteroid(asteroid) {
        const FRAGMENT_SPEED = this.ASTEROID_SPEED * 2;
        let newSize;
        
        // Determine size based on generation
        if (asteroid.generation === 0) {
            newSize = this.ASTEROID_SIZES.MEDIUM;
        } else if (asteroid.generation === 1) {
            newSize = this.ASTEROID_SIZES.SMALL;
        } else {
            return; // Don't split if it's already the smallest size
        }
        
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.gameState.asteroids.push({
                x: asteroid.x,
                y: asteroid.y,
                size: newSize,
                velocity: {
                    x: asteroid.velocity.x + Math.cos(angle) * FRAGMENT_SPEED,
                    y: asteroid.velocity.y + Math.sin(angle) * FRAGMENT_SPEED
                },
                rotation: Math.random() * Math.PI * 2,
                generation: asteroid.generation + 1
            });
        }
    }

    checkCollision(obj1, obj2) {
        // Get the actual sizes for the objects
        let size1 = obj1.size;
        let size2 = obj2.size;
        
        if (obj1 === this.gameState.player) {
            size1 = this.PLAYER_SIZE;
        }
        
        // Handle wrapping around screen edges
        const positions = [
            { x: obj1.x, y: obj1.y }  // Original position
        ];
        
        // Only add wrapped positions if objects are near edges
        if (obj1.x < size1) positions.push({ x: obj1.x + this.GAME_WIDTH, y: obj1.y });
        if (obj1.x > this.GAME_WIDTH - size1) positions.push({ x: obj1.x - this.GAME_WIDTH, y: obj1.y });
        if (obj1.y < size1) positions.push({ x: obj1.x, y: obj1.y + this.GAME_HEIGHT });
        if (obj1.y > this.GAME_HEIGHT - size1) positions.push({ x: obj1.x, y: obj1.y - this.GAME_HEIGHT });

        // Check all possible wrapping positions
        for (const pos of positions) {
            const dx = pos.x - obj2.x;
            const dy = pos.y - obj2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = size1 + size2; // Exact collision distance
            
            if (distance < minDistance) {
                return true;
            }
        }
        
        return false;
    }

    // Override the parent's getBuffer to provide game rendering data
    getBuffer() {
        // Clear the buffer
        this.initializeBuffer();

        // Convert game state to character buffer
        // This is just for debug/fallback - we'll implement custom rendering
        return this.buffer;
    }

    // Add method to get raw game state for custom rendering
    getGameState() {
        return this.gameState;
    }
} 