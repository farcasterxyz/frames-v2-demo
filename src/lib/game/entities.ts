export class Gun {
  private lastX: number;
  private rotation: number = 0;
  
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {
    this.lastX = x;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Calculate rotation based on movement
    const dx = this.x - this.lastX;
    // Smooth rotation transition
    const targetRotation = dx * 0.05; // Convert movement to rotation (radians)
    this.rotation = this.rotation * 0.8 + targetRotation * 0.2; // Smooth transition
    
    // Save current drawing state
    ctx.save();
    
    // Move to gun position
    ctx.translate(this.x, this.y + this.height / 2);
    
    // Apply rotation
    ctx.rotate(this.rotation);
    
    // Draw gun body (rectangle) - centered at origin
    ctx.fillStyle = '#888';
    ctx.fillRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    
    // Draw gun barrel (rectangle)
    ctx.fillStyle = '#666';
    const barrelWidth = this.width / 3;
    const barrelHeight = this.height / 4;
    ctx.fillRect(
      -barrelWidth / 2,
      -this.height / 2 - barrelHeight,
      barrelWidth,
      barrelHeight
    );
    
    // Draw base (wider rectangle)
    ctx.fillStyle = '#555';
    const baseWidth = this.width * 1.5;
    const baseHeight = this.height / 3;
    ctx.fillRect(
      -baseWidth / 2,
      this.height / 2 - baseHeight,
      baseWidth,
      baseHeight
    );
    
    // Restore drawing state
    ctx.restore();
    
    // Update lastX for next frame
    this.lastX = this.x;
  }
}

export class Zombie {
  public active = true;
  private image: HTMLImageElement;

  constructor(
    public x: number,
    public y: number,
    public size: number,
    public speed: number
  ) {
    // Load zombie image
    this.image = new Image();
    this.image.src = '/images/zombie.png';
  }

  update(deltaTime: number): void {
    // Move downward
    this.y += this.speed * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // If image is loaded, draw it
    if (this.image.complete) {
      ctx.drawImage(
        this.image,
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size
      );
    } else {
      // Fallback to original square if image isn't loaded yet
      ctx.fillStyle = '#22aa22';
      ctx.fillRect(
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size
      );
      
      // Draw zombie eyes
      ctx.fillStyle = '#ff0000';
      const eyeSize = this.size / 6;
      const eyeOffset = this.size / 5;
      
      // Left eye
      ctx.fillRect(
        this.x - eyeOffset - eyeSize / 2,
        this.y - eyeOffset - eyeSize / 2,
        eyeSize,
        eyeSize
      );
      
      // Right eye
      ctx.fillRect(
        this.x + eyeOffset - eyeSize / 2,
        this.y - eyeOffset - eyeSize / 2,
        eyeSize,
        eyeSize
      );
      
      // Draw zombie mouth (angry line)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x - this.size / 4, this.y + this.size / 5);
      ctx.lineTo(this.x + this.size / 4, this.y + this.size / 5);
      ctx.stroke();
    }
  }
}

export class Civilian {
  private image: HTMLImageElement;

  constructor(
    public x: number,
    public y: number,
    public size: number,
    public speed: number
  ) {
    // Load human image
    this.image = new Image();
    this.image.src = '/images/human.png';
  }

  update(deltaTime: number): void {
    // Move horizontally
    this.x += this.speed * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // If image is loaded, draw it
    if (this.image.complete) {
      ctx.drawImage(
        this.image,
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size
      );
    } else {
      // Fallback to original circle if image isn't loaded yet
      // Draw civilian body (blue circle)
      ctx.fillStyle = '#2288ff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw civilian face
      ctx.fillStyle = '#000';
      const eyeSize = this.size / 10;
      const eyeOffset = this.size / 6;
      
      // Eyes
      ctx.beginPath();
      ctx.arc(this.x - eyeOffset, this.y - eyeOffset, eyeSize, 0, Math.PI * 2);
      ctx.arc(this.x + eyeOffset, this.y - eyeOffset, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Smile
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 4, 0, Math.PI);
      ctx.stroke();
    }
  }
}

export class Bullet {
  public isFlash: boolean = false;
  
  constructor(
    public x: number,
    public y: number,
    public size: number,
    public speed: number,
    public dirX: number = 0,
    public dirY: number = -1
  ) {}

  update(deltaTime: number): void {
    // Don't move if it's a muzzle flash
    if (this.isFlash) return;
    
    // Move in the direction vector
    this.x += this.dirX * this.speed * deltaTime;
    this.y += this.dirY * this.speed * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.isFlash) {
      // Draw muzzle flash effect (brighter, more orange)
      const gradient = ctx.createRadialGradient(
        this.x, this.y, this.size / 8,
        this.x, this.y, this.size * 1.5
      );
      gradient.addColorStop(0, 'rgba(255, 200, 50, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    
    // Draw regular bullet (yellow dot)
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a glow effect
    const gradient = ctx.createRadialGradient(
      this.x, this.y, this.size / 4,
      this.x, this.y, this.size
    );
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add directional trail effect
    if (this.speed > 0) {
      const trailGradient = ctx.createLinearGradient(
        this.x, this.y,
        this.x - this.dirX * this.size * 2,
        this.y - this.dirY * this.size * 2
      );
      trailGradient.addColorStop(0, 'rgba(255, 255, 0, 0.5)');
      trailGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      
      ctx.fillStyle = trailGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
