import React, { useEffect, useState, useMemo } from 'react';

interface Particle {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

interface FireworksProps {
  isActive: boolean;
  centerX: number;
  centerY: number;
  sizeFactor: number; // 0.2 to 1.0
  baseColor: string; // HSL format for easier manipulation
}

const NUM_PARTICLES = 80;
const MAX_SPREAD_RADIUS = 220;
const MIN_PARTICLE_SIZE = 4;
const MAX_PARTICLE_SIZE = 14;
// Adjusted for 1.5x speed
const FADEOUT_DURATION = 200; // Was 300

const Fireworks: React.FC<FireworksProps> = ({ isActive, centerX, centerY, sizeFactor, baseColor }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const generatedParticles = useMemo(() => {
    if (!isActive) return [];

    const newParticles: Particle[] = [];
    const numCurrentParticles = Math.floor(NUM_PARTICLES * (sizeFactor * 0.8 + 0.4));

    for (let i = 0; i < numCurrentParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spread = Math.random() * MAX_SPREAD_RADIUS * sizeFactor;
      const endX = centerX + Math.cos(angle) * spread;
      const endY = centerY + Math.sin(angle) * spread;
      
      const [h, s, l] = baseColor.match(/\d+/g)?.map(Number) || [200, 70, 60];
      const randomLightness = Math.max(45, Math.min(85, l + (Math.random() - 0.5) * 35));
      const randomSaturation = Math.max(55, Math.min(95, s + (Math.random() - 0.5) * 25));
      const particleColor = `hsl(${h}, ${randomSaturation}%, ${randomLightness}%)`;

      newParticles.push({
        id: `p-${i}-${Date.now()}`,
        startX: centerX,
        startY: centerY,
        endX: endX,
        endY: endY,
        color: particleColor,
        size: (MIN_PARTICLE_SIZE + Math.random() * (MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE)) * sizeFactor,
        // Adjusted for 1.5x speed
        delay: Math.random() * 167, // Was 250
        duration: 333 + Math.random() * 267, // Was 500 + Math.random() * 400 (0.5s-0.9s -> 0.33s-0.6s)
      });
    }
    return newParticles;
  }, [isActive, centerX, centerY, sizeFactor, baseColor]);


  useEffect(() => {
    if (isActive) {
      setParticles(generatedParticles);
    } else {
      const timer = setTimeout(() => {
        setParticles([]);
      }, FADEOUT_DURATION + 100); 
      return () => clearTimeout(timer);
    }
  }, [isActive, generatedParticles]);


  if (particles.length === 0 && !isActive) {
    return null;
  }

  return (
    <g pointerEvents="none">
      {particles.map(p => (
        <circle
          key={p.id}
          cx={p.startX}
          cy={p.startY}
          r={p.size}
          fill={p.color}
          style={{
            animation: isActive 
              ? `firework-explode ${p.duration}ms ease-out ${p.delay}ms forwards`
              : `firework-fadeout ${FADEOUT_DURATION}ms ease-in forwards`,
          }}
        >
          <animateMotion
            dur={`${p.duration}ms`}
            begin={`${p.delay}ms`}
            path={`M0,0 L${p.endX - p.startX},${p.endY - p.startY}`}
            fill="freeze"
          />
        </circle>
      ))}
      <style>{`
        @keyframes firework-explode {
          0% { opacity: 0.7; transform: scale(0.2); }
          20% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(0.6); }
        }
        @keyframes firework-fadeout {
          0% { opacity: 1; } 
          100% { opacity: 0; transform: scale(0.5); }
        }
      `}</style>
    </g>
  );
};

export default Fireworks;