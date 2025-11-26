import React, { useRef, useEffect } from 'react';

const ParticleAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let mouse = { x: -9999, y: -9999 };

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      // Calculate particle density based on screen size
      const particleCount = Math.floor((canvas.width * canvas.height) / 12000); 
      
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      originalX: number;
      originalY: number;
      density: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.originalX = this.x;
        this.originalY = this.y;
        this.size = Math.random() * 1.5 + 0.5; // Small, subtle dots
        this.speedX = (Math.random() - 0.5) * 0.3; // Slow drift
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.density = (Math.random() * 20) + 1;
        
        // Futuristic palette: White, Cyan, Purple with transparency
        const colors = [
            'rgba(255, 255, 255, 0.4)', 
            'rgba(255, 255, 255, 0.2)',
            'rgba(56, 189, 248, 0.3)',  // Light Blue
            'rgba(147, 51, 234, 0.2)'   // Light Purple
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen edges
        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;

        // Mouse Interaction: Subtle Repulsion/Parallax
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const maxDist = 150;

        if (distance < maxDist) {
             const forceDirectionX = dx / distance;
             const forceDirectionY = dy / distance;
             const force = (maxDist - distance) / maxDist;
             const directionX = forceDirectionX * force * this.density * 0.8;
             const directionY = forceDirectionY * force * this.density * 0.8;
             
             this.x -= directionX;
             this.y -= directionY;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Slight glow for larger particles
        if (this.size > 1.2) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }
      }
    }

    const animate = () => {
      // Clear canvas with transparency for clean movement (no trails)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };
    
    const handleResize = () => {
        init();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    init();
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-80" />;
};

export default ParticleAnimation;