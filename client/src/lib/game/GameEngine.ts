import { Gun, Zombie, Civilian, Bullet } from "./entities";
import { useAudio } from "@/lib/stores/useAudio";

interface GameCallbacks {
  onScoreUpdate: (points: number) => void;
  onLifeLost: () => void;
  onGameOver: () => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gun: Gun;
  private zombies: Zombie[] = [];
  private civilians: Civilian[] = [];
  private bullets: Bullet[] = [];
  private lastZombieSpawn = 0;
  private lastCivilianSpawn = 0;
  private zombieSpawnRate = 2000; // milliseconds
  private civilianSpawnRate = 3000; // milliseconds
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  private score = 0;
  private isPaused = false;
  private difficulty = 1;
  private difficultyIncreaseInterval = 10000; // 10 seconds
  private lastDifficultyIncrease = 0;
  private callbacks: GameCallbacks;
  private boundHandleClick: (e: MouseEvent) => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleTouch: (e: TouchEvent) => void;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleTouchMove: (e: TouchEvent) => void;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    callbacks: GameCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.gun = new Gun(canvas.width / 2, canvas.height - 40, 30, 40);
    
    // Bind event handlers to this instance
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleTouch = this.handleTouch.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
  }

  public init(): void {
    // Set up event listeners
    this.canvas.addEventListener('click', this.boundHandleClick);
    document.addEventListener('keydown', this.boundHandleKeyDown);
    this.canvas.addEventListener('touchstart', this.boundHandleTouch);
    
    // Add mouse/touch move listeners for aiming
    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.addEventListener('touchmove', this.boundHandleTouchMove);
    
    // Start the game loop
    this.lastTimestamp = performance.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  public cleanup(): void {
    // Remove event listeners
    this.canvas.removeEventListener('click', this.boundHandleClick);
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    this.canvas.removeEventListener('touchstart', this.boundHandleTouch);
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.removeEventListener('touchmove', this.boundHandleTouchMove);
    
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resizeCanvas(width: number, height: number): void {
    // Update gun position on resize
    this.gun.x = width / 2;
    this.gun.y = height - 40;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTimestamp = performance.now();
      this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  private gameLoop(timestamp: number): void {
    if (this.isPaused) return;
    
    // Calculate delta time in seconds
    const deltaTime = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update game state
    this.update(deltaTime, timestamp);
    
    // Draw everything
    this.draw();
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(deltaTime: number, timestamp: number): void {
    // Increase difficulty over time
    if (timestamp - this.lastDifficultyIncrease > this.difficultyIncreaseInterval) {
      this.difficulty += 0.1;
      this.zombieSpawnRate = Math.max(500, this.zombieSpawnRate - 100);
      this.lastDifficultyIncrease = timestamp;
    }
    
    // Spawn new zombies
    if (timestamp - this.lastZombieSpawn > this.zombieSpawnRate) {
      this.spawnZombie();
      this.lastZombieSpawn = timestamp;
    }
    
    // Spawn new civilians
    if (timestamp - this.lastCivilianSpawn > this.civilianSpawnRate) {
      this.spawnCivilian();
      this.lastCivilianSpawn = timestamp;
    }
    
    // Update entities
    this.updateBullets(deltaTime);
    this.updateZombies(deltaTime);
    this.updateCivilians(deltaTime);
    
    // Check collisions
    this.checkCollisions();
  }

  private spawnZombie(): void {
    const x = Math.random() * (this.canvas.width - 40) + 20; // Keep away from edges
    const size = 30;
    const speed = (50 + Math.random() * 30) * this.difficulty; // Pixels per second
    
    this.zombies.push(new Zombie(x, -size, size, speed));
  }

  private spawnCivilian(): void {
    const size = 24;
    const startOnRight = Math.random() > 0.5;
    const x = startOnRight ? this.canvas.width + size : -size;
    const y = Math.random() * (this.canvas.height / 2) + 50; // Top half of screen
    const speed = 40 + Math.random() * 30; // Pixels per second
    const direction = startOnRight ? -1 : 1;
    
    this.civilians.push(new Civilian(x, y, size, speed * direction));
  }

  private updateBullets(deltaTime: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);
      
      // Remove bullets that are off screen in any direction
      if (
        bullet.y < -bullet.size || 
        bullet.y > this.canvas.height + bullet.size ||
        bullet.x < -bullet.size ||
        bullet.x > this.canvas.width + bullet.size
      ) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private updateZombies(deltaTime: number): void {
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];
      zombie.update(deltaTime);
      
      // Check if zombie reached the bottom
      if (zombie.y > this.canvas.height) {
        // Remove zombie and lose a life
        this.zombies.splice(i, 1);
        this.callbacks.onLifeLost();
      }
    }
  }

  private updateCivilians(deltaTime: number): void {
    for (let i = this.civilians.length - 1; i >= 0; i--) {
      const civilian = this.civilians[i];
      civilian.update(deltaTime);
      
      // Remove civilians that are off screen
      if ((civilian.speed > 0 && civilian.x > this.canvas.width + civilian.size) ||
          (civilian.speed < 0 && civilian.x < -civilian.size)) {
        this.civilians.splice(i, 1);
      }
    }
  }

  private checkCollisions(): void {
    // Check bullet collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      let hitSomething = false;
      
      // Check zombie hits
      for (let j = this.zombies.length - 1; j >= 0; j--) {
        const zombie = this.zombies[j];
        
        if (this.checkCollision(bullet, zombie)) {
          // Hit a zombie
          this.zombies.splice(j, 1);
          hitSomething = true;
          this.updateScore(10);
          
          // Play hit sound
          const audioStore = useAudio.getState();
          audioStore.playHit();
          
          break;
        }
      }
      
      // Check civilian hits (only if bullet didn't hit a zombie)
      if (!hitSomething) {
        for (let j = this.civilians.length - 1; j >= 0; j--) {
          const civilian = this.civilians[j];
          
          if (this.checkCollision(bullet, civilian)) {
            // Hit a civilian
            this.civilians.splice(j, 1);
            hitSomething = true;
            this.updateScore(-50);
            break;
          }
        }
      }
      
      // Remove bullet if it hit something
      if (hitSomething) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private checkCollision(a: { x: number, y: number, size: number }, 
                          b: { x: number, y: number, size: number }): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (a.size / 2 + b.size / 2);
  }

  private updateScore(points: number): void {
    this.score += points;
    this.callbacks.onScoreUpdate(points);
  }

  private draw(): void {
    // Draw gun
    this.gun.draw(this.ctx);
    
    // Draw zombies
    for (const zombie of this.zombies) {
      zombie.draw(this.ctx);
    }
    
    // Draw civilians
    for (const civilian of this.civilians) {
      civilian.draw(this.ctx);
    }
    
    // Draw bullets
    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }
  }

  private shoot(targetX: number, targetY: number): void {
    // Starting position of the bullet (from the gun's barrel)
    const startX = this.gun.x;
    const startY = this.gun.y - this.gun.height / 2;
    
    // Calculate direction vector
    let dirX = targetX - startX;
    let dirY = targetY - startY;
    
    // Normalize the direction vector
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length > 0) {
      dirX /= length;
      dirY /= length;
      
      // Limit the shooting angle (ensure bullets can't go downward)
      if (dirY > 0) {
        // Trying to shoot downward, limit to horizontal
        dirY = 0;
        // Re-normalize if needed
        if (dirX !== 0) {
          dirX = dirX > 0 ? 1 : -1;
        } else {
          // If no horizontal component, default to up
          dirY = -1;
        }
      }
      
      // Limit extreme angles (can't shoot directly left/right)
      const minUpwardComponent = 0.3; // Minimum Y component
      if (Math.abs(dirY) < minUpwardComponent) {
        // Too horizontal, add more upward component
        dirY = -minUpwardComponent;
        // Re-normalize
        const newLength = Math.sqrt(dirX * dirX + dirY * dirY);
        dirX /= newLength;
        dirY /= newLength;
      }
    } else {
      // Default to shooting straight up if no direction
      dirX = 0;
      dirY = -1;
    }
    
    // Create a new bullet with direction
    const barrelLength = this.gun.height / 4;
    const bulletStartY = this.gun.y - barrelLength;
    const bullet = new Bullet(startX, bulletStartY, 6, 400, dirX, dirY);
    
    // Add some visual variety to bullets
    this.bullets.push(bullet);
    
    // Add muzzle flash effect
    this.addMuzzleFlash(startX, bulletStartY);
  }
  
  private addMuzzleFlash(x: number, y: number): void {
    // Create a temporary "bullet" that will serve as a muzzle flash
    const flash = new Bullet(x, y, 12, 0); // No speed, just a visual effect
    flash.isFlash = true; // Mark as flash for special rendering
    
    // Add to bullets array but will be removed quickly
    this.bullets.push(flash);
    
    // Remove the flash after a short time
    setTimeout(() => {
      const index = this.bullets.findIndex(b => b.isFlash === true);
      if (index !== -1) {
        this.bullets.splice(index, 1);
      }
    }, 50); // Flash duration in milliseconds
  }

  private handleClick(e: MouseEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Aim the gun (limited to a reasonable angle)
    this.aimGun(clickX);
    
    this.shoot(clickX, clickY);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      e.preventDefault();
      // When using spacebar, shoot straight up
      this.shoot(this.gun.x, 0);
    }
  }

  private handleTouch(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const touchY = e.touches[0].clientY - rect.top;
      
      // Aim the gun
      this.aimGun(touchX);
      
      this.shoot(touchX, touchY);
    }
  }
  
  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Aim the gun based on mouse position
    this.aimGun(mouseX);
  }
  
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault(); // Prevent scrolling
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      
      // Aim the gun based on touch position
      this.aimGun(touchX);
    }
  }
  
  private aimGun(targetX: number): void {
    // Calculate how far the gun can move from center
    const maxOffset = this.canvas.width / 4;
    
    // Get distance from center, clamped to max offset
    const centerX = this.canvas.width / 2;
    const offset = Math.max(-maxOffset, Math.min(maxOffset, targetX - centerX));
    
    // Move the gun within the allowed range
    this.gun.x = centerX + offset * 0.2; // Apply a dampening factor to prevent extreme movements
  }
}
