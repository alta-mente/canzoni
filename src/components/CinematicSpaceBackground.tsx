import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export const CinematicSpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Particle field
    const particleCount = 100;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.7 + 0.2,
      pulse: Math.random() * Math.PI,
    }));

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(time + p.pulse));

        if (isDark) {
          ctx.fillStyle = `rgba(255, 120, 140, ${currentAlpha * 0.75})`;
        } else {
          ctx.fillStyle = `rgba(230, 57, 70, ${currentAlpha * 0.35})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-colors duration-700">
      {/* Background base tone */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark ? 'bg-[#05060a]' : 'bg-[#faf8f5]'
        }`}
      />

      {/* Atmospheric Mars Glow */}
      <div
        className={`absolute -bottom-[25vh] -left-[20vw] w-[140vw] h-[75vh] rounded-[100%] blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isDark
            ? 'opacity-40 mix-blend-screen'
            : 'opacity-25 mix-blend-multiply'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at center bottom, rgba(230, 57, 70, 0.7) 0%, rgba(255, 107, 107, 0.25) 50%, transparent 80%)'
            : 'radial-gradient(ellipse at center bottom, rgba(230, 57, 70, 0.45) 0%, rgba(255, 150, 100, 0.2) 50%, transparent 80%)',
        }}
      />

      {/* Distant Nebula Glow */}
      <div
        className={`absolute -top-[20vh] -right-[20vw] w-[70vw] h-[70vw] rounded-full blur-[160px] pointer-events-none transition-opacity duration-700 ${
          isDark ? 'opacity-25 mix-blend-screen' : 'opacity-15 mix-blend-multiply'
        }`}
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(160, 25, 50, 0.6) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(230, 57, 70, 0.3) 0%, transparent 70%)',
        }}
      />

      {/* Subtle Grid overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          isDark ? 'opacity-[0.03]' : 'opacity-[0.04]'
        }`}
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Canvas for particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
