
import React, { useRef, useEffect } from 'react';

interface GalaxyProps {
  mouseRepulsion?: boolean;
  mouseInteraction?: boolean;
  density?: number;
  glowIntensity?: number;
  saturation?: number;
  hueShift?: number;
}

const Galaxy: React.FC<GalaxyProps> = ({
  mouseRepulsion = true,
  mouseInteraction = true,
  density = 1.5,
  glowIntensity = 0.5,
  saturation = 0.8,
  hueShift = 240,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let animationFrameId: number;
    let mouse = { x: -1000, y: -1000 };

    // Initialize dimensions
    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initParticles();
    };

    class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        color: string;
        baseX: number;
        baseY: number;
        z: number;

        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseX = this.x;
            this.baseY = this.y;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.z = Math.random() * 2 + 0.5; // Depth factor
            this.size = Math.random() * 2;
            
            // Color generation based on hueShift and saturation
            const h = hueShift + (Math.random() * 60 - 30);
            const s = saturation * 100;
            const l = Math.random() * 50 + 50;
            this.color = `hsla(${h}, ${s}%, ${l}%, ${Math.random() * 0.5 + 0.1})`;
        }

        update() {
            // Basic movement
            this.x += this.vx * this.z;
            this.y += this.vy * this.z;

            // Wrap around screen
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;

            // Mouse Interaction
            if (mouseInteraction) {
                // Parallax effect
                const dx = mouse.x - width / 2;
                const dy = mouse.y - height / 2;
                this.x -= dx * 0.0005 * this.z;
                this.y -= dy * 0.0005 * this.z;
            }

            // Repulsion effect
            if (mouseRepulsion) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceDistance = 150;

                if (distance < forceDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (forceDistance - distance) / forceDistance;
                    const directionX = forceDirectionX * force * 5;
                    const directionY = forceDirectionY * force * 5;

                    this.x -= directionX;
                    this.y -= directionY;
                }
            }
        }

        draw(context: CanvasRenderingContext2D) {
            context.beginPath();
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.fillStyle = this.color;
            
            // Glow effect
            if (glowIntensity > 0) {
                context.shadowBlur = this.size * 10 * glowIntensity;
                context.shadowColor = this.color;
            }
            
            context.fill();
            context.shadowBlur = 0; // Reset
        }
    }

    const initParticles = () => {
        particles = [];
        const particleCount = (width * height) / 10000 * density; // Responsive density
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    };

    const animate = () => {
        // Trail effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; 
        ctx.fillRect(0, 0, width, height);

        particles.forEach(particle => {
            particle.update();
            particle.draw(ctx);
        });

        animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
        mouse.x = -1000;
        mouse.y = -1000;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    resize();
    animate();

    return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
        cancelAnimationFrame(animationFrameId);
    };
  }, [mouseRepulsion, mouseInteraction, density, glowIntensity, saturation, hueShift]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block bg-black" />;
};

export default Galaxy;
