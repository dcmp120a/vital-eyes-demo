import React, { useState, useEffect, useCallback } from 'react';
import BrainRegionNode from './BrainRegionNode';
import ConnectionPath from './ConnectionPath';
import EyeSaccadeAnimation from './EyeSaccadeAnimation';
import Fireworks from './Fireworks';

interface BrainRegion {
  id: string;
  name: string;
  abbreviation: string;
  x: number;
  y: number;
  radius?: number;
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

const regionsData: BrainRegion[] = [
  { id: 'pfc', name: '전전두피질 (Prefrontal Cortex)', abbreviation: 'PFC', x: 300, y: 120, radius: 60 },
  { id: 'sef', name: '보조안구영역 (Supplementary Eye Fields)', abbreviation: 'SEF', x: 200, y: 200, radius: 45 },
  { id: 'fef', name: '전두안구영역 (Frontal Eye Fields)', abbreviation: 'FEF', x: 400, y: 200, radius: 50 },
  { id: 'pef', name: '두정안구영역 (Parietal Eye Fields / PPC)', abbreviation: 'PEF/PPC', x: 500, y: 150, radius: 55 },
  { id: 'sc', name: '상구 (Superior Colliculus)', abbreviation: 'SC', x: 450, y: 450, radius: 50 },
  { id: 'bg', name: '기저핵 (Basal Ganglia)', abbreviation: 'BG', x: 150, y: 450, radius: 45 },
];

const connectionsData: Connection[] = [
  { id: 'c1', from: 'pfc', to: 'fef' },
  { id: 'c2', from: 'pfc', to: 'sc' },
  { id: 'c3', from: 'pef', to: 'fef' },
  { id: 'c4', from: 'pef', to: 'sc' },
  { id: 'c5', from: 'fef', to: 'sc' },
  { id: 'c6', from: 'sef', to: 'fef' },
  { id: 'c7', from: 'bg', to: 'sc' },
  { id: 'c8', from: 'pfc', to: 'bg' },
  { id: 'c9', from: 'fef', to: 'bg' },
  { id: 'c10', from: 'sef', to: 'bg' },
];

const SVG_WIDTH = 650;
const SVG_HEIGHT = 650;
const EYE_ANIMATION_AREA_HEIGHT = 120;

const ANIMATION_STEP_DURATION = 800; 
const ANIMATION_INTER_STEP_DELAY = 233; 
const PAUSE_AFTER_CYCLE_DURATION = 667; 
const FIREWORKS_DURATION = 1867; 
const NUM_FIREWORKS_CYCLES = 3; 

const SMILE_DISPLAY_DURATION_BEFORE_SPREAD = 800; // Duration to show smile before spread effect
const SMILE_SPREAD_ANIMATION_DURATION_MS = 1000; // Duration of the smile spread effect itself

const TARGET_A_COLOR_HSL = "hsl(210, 100%, 50%)"; // 파란색
const TARGET_B_COLOR_HSL = "hsl(220, 90%, 60%)"; // 밝은 파란색

type AnimationPhase = 'EYE_TO_A' | 'CIRCUIT_A' | 'EYE_TO_B' | 'CIRCUIT_B' | 'FIREWORKS' | 'ENDING' | 'ENDING_SMILE_EFFECT';

const BrainCircuitDiagram: React.FC = () => {
  const [activeConnections, setActiveConnections] = useState<string[]>([]);
  const [activeRegions, setActiveRegions] = useState<string[]>([]);
  const [animationProgress, setAnimationProgress] = useState<number>(0);

  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>('EYE_TO_A');
  const [eyeTarget, setEyeTarget] = useState<'A' | 'B'>('A');
  const [currentActiveColor, setCurrentActiveColor] = useState<string>(TARGET_A_COLOR_HSL);

  const [fireworksActive, setFireworksActive] = useState<boolean>(false);
  const [fireworksCycle, setFireworksCycle] = useState<number>(0);
  const [allFireworksCyclesComplete, setAllFireworksCyclesComplete] = useState<boolean>(false);
  const fireworksCenter = { x: SVG_WIDTH / 2, y: SVG_HEIGHT / 2 };

  useEffect(() => {
    // This effect primarily handles setup for each phase
    // If all fireworks cycles complete, the phase is already 'ENDING' or 'ENDING_SMILE_EFFECT'
    if (allFireworksCyclesComplete && (currentPhase === 'ENDING' || currentPhase === 'ENDING_SMILE_EFFECT')) {
        setCurrentActiveColor(TARGET_B_COLOR_HSL); // Keep circuit B color
        return;
    }
    
    // Reset/setup for regular phases
    if (currentPhase === 'EYE_TO_A') {
      setEyeTarget('A');
      setCurrentActiveColor(TARGET_A_COLOR_HSL);
      setAnimationProgress(0);
      setActiveConnections([]);
      setActiveRegions([]);
      setFireworksActive(false); 
    } else if (currentPhase === 'EYE_TO_B') {
      setEyeTarget('B');
      setCurrentActiveColor(TARGET_B_COLOR_HSL);
      setAnimationProgress(0);
      setActiveConnections([]);
      setActiveRegions([]);
    } else if (currentPhase === 'CIRCUIT_A') {
      setCurrentActiveColor(TARGET_A_COLOR_HSL);
    } else if (currentPhase === 'CIRCUIT_B' || currentPhase === 'FIREWORKS') { 
      setCurrentActiveColor(TARGET_B_COLOR_HSL);
    }
  }, [currentPhase, allFireworksCyclesComplete]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (currentPhase === 'ENDING') {
        // In 'ENDING' phase, we just display the smile.
        // After a delay, transition to 'ENDING_SMILE_EFFECT'.
        setActiveRegions(regionsData.map(r => r.id)); // Keep brain lit
        setActiveConnections(connectionsData.map(c => c.id));
        setCurrentActiveColor(TARGET_B_COLOR_HSL);
        timerId = setTimeout(() => {
            setCurrentPhase('ENDING_SMILE_EFFECT');
        }, SMILE_DISPLAY_DURATION_BEFORE_SPREAD);
        return () => clearTimeout(timerId);
    }
    
    if (currentPhase === 'ENDING_SMILE_EFFECT') {
        // This phase is mainly for EyeSaccadeAnimation to play its effect.
        // BrainCircuitDiagram waits for onSmileSpreadEffectComplete.
        // No specific timer needed here as EyeSaccadeAnimation controls its own duration.
        return;
    }

    if (allFireworksCyclesComplete) return; // Should not run circuit/fireworks logic if end sequence started

    if (currentPhase === 'CIRCUIT_A' || currentPhase === 'CIRCUIT_B') {
      const currentConnectionIndex = animationProgress;
      if (currentConnectionIndex < connectionsData.length) {
        const conn = connectionsData[currentConnectionIndex];
        setActiveConnections(prev => [...new Set([...prev, conn.id])]);
        setActiveRegions(prev => [...new Set([...prev, conn.from, conn.to])]);
        timerId = setTimeout(() => {
          setAnimationProgress(prev => prev + 1);
        }, ANIMATION_INTER_STEP_DELAY);
      } else if (currentConnectionIndex === connectionsData.length) {
        const remainingTimeForLastAnimation = Math.max(0, ANIMATION_STEP_DURATION - ANIMATION_INTER_STEP_DELAY);
        timerId = setTimeout(() => {
          if (currentPhase === 'CIRCUIT_A') {
            setCurrentPhase('EYE_TO_B');
          } else if (currentPhase === 'CIRCUIT_B') {
            setCurrentPhase('FIREWORKS'); 
          }
        }, remainingTimeForLastAnimation + PAUSE_AFTER_CYCLE_DURATION);
      }
    } else if (currentPhase === 'FIREWORKS') {
      setFireworksActive(true);
      timerId = setTimeout(() => {
        setFireworksActive(false);
        const nextFireworksCycle = fireworksCycle + 1;
        if (nextFireworksCycle >= NUM_FIREWORKS_CYCLES) {
          setAllFireworksCyclesComplete(true);
          setCurrentPhase('ENDING'); 
        } else {
          setFireworksCycle(nextFireworksCycle);
          setCurrentPhase('EYE_TO_A'); 
        }
      }, FIREWORKS_DURATION);
    }

    return () => clearTimeout(timerId);
  }, [animationProgress, currentPhase, allFireworksCyclesComplete, fireworksCycle]);

  const handleEyeAnimationComplete = useCallback(() => {
    if (allFireworksCyclesComplete) return;

    if (currentPhase === 'EYE_TO_A') {
      setCurrentPhase('CIRCUIT_A');
    } else if (currentPhase === 'EYE_TO_B') {
      setCurrentPhase('CIRCUIT_B');
    }
  }, [currentPhase, allFireworksCyclesComplete]);
  
  const handleSmileSpreadEffectComplete = useCallback(() => {
    setAllFireworksCyclesComplete(false); // Reset for next full loop
    setFireworksCycle(0); // Reset fireworks cycle count
    setCurrentPhase('EYE_TO_A'); // Restart the entire animation
  }, []);


  const getRegionCoords = (regionId: string): { x: number; y: number } => {
    const region = regionsData.find(r => r.id === regionId);
    return region ? { x: region.x, y: region.y } : { x: 0, y: 0 };
  };

  const fireworksSizeFactor = (fireworksCycle / Math.max(1, NUM_FIREWORKS_CYCLES -1 )) * 0.8 + 0.2; 


  return (
    <div className="flex flex-col items-center w-full">
      <div style={{ height: EYE_ANIMATION_AREA_HEIGHT, width: '100%' }} className="mb-3">
        <EyeSaccadeAnimation
          targetSide={eyeTarget}
          onAnimationComplete={handleEyeAnimationComplete}
          isActivelyMoving={currentPhase === 'EYE_TO_A' || currentPhase === 'EYE_TO_B'}
          showSmilingFace={allFireworksCyclesComplete || currentPhase === 'ENDING' || currentPhase === 'ENDING_SMILE_EFFECT'}
          triggerSmileSpreadEffect={currentPhase === 'ENDING_SMILE_EFFECT'}
          onSmileSpreadEffectComplete={handleSmileSpreadEffectComplete}
          smileSpreadAnimationDurationMs={SMILE_SPREAD_ANIMATION_DURATION_MS}
          width={SVG_WIDTH}
          height={EYE_ANIMATION_AREA_HEIGHT}
          targetAColor={TARGET_A_COLOR_HSL}
          targetBColor={TARGET_B_COLOR_HSL}
        />
      </div>

      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-auto rounded-md overflow-hidden" aria-label="Brain circuit diagram">
        <defs>
          <radialGradient id="svgBgGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="100%" stopColor="rgba(248, 250, 252, 0.95)" />
          </radialGradient>
          <filter id="glow" x="-75%" y="-75%" width="250%" height="250%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMorphology operator="dilate" radius="1" in="coloredBlur" result="dilatedBlur" />
            <feMerge>
              <feMergeNode in="dilatedBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#svgBgGradient)" />

        {/* 뇌 윤곽선 배경 */}
        <g opacity="0.1" fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2">
          {/* 왼쪽 뇌반구 */}
          <path d="M 80 120 Q 60 180 80 240 Q 100 300 120 360 Q 140 420 160 480 Q 180 520 200 540 Q 220 560 240 570 Q 260 580 280 580 Q 300 580 320 570 Q 340 560 360 540 Q 380 520 400 480 Q 420 420 440 360 Q 460 300 480 240 Q 500 180 480 120 Q 460 80 440 60 Q 420 40 400 30 Q 380 20 360 20 Q 340 20 320 30 Q 300 40 280 60 Q 260 80 240 120 Q 220 160 200 120 Q 180 80 160 60 Q 140 40 120 30 Q 100 20 80 20 Q 60 20 40 30 Q 20 40 0 60 Q -20 80 0 120 Z" />
          
          {/* 오른쪽 뇌반구 */}
          <path d="M 570 120 Q 590 180 570 240 Q 550 300 530 360 Q 510 420 490 480 Q 470 520 450 540 Q 430 560 410 570 Q 390 580 370 580 Q 350 580 330 570 Q 310 560 290 540 Q 270 520 250 480 Q 230 420 210 360 Q 190 300 170 240 Q 150 180 170 120 Q 190 80 210 60 Q 230 40 250 30 Q 270 20 290 20 Q 310 20 330 30 Q 350 40 370 60 Q 390 80 410 120 Q 430 160 450 120 Q 470 80 490 60 Q 510 40 530 30 Q 550 20 570 20 Q 590 20 610 30 Q 630 40 650 60 Q 670 80 650 120 Z" />
          
          {/* 뇌간 */}
          <path d="M 300 580 L 320 600 L 340 620 L 360 640 L 380 650 L 400 650 L 420 640 L 440 620 L 460 600 L 480 580" />
          
          {/* 소뇌 */}
          <ellipse cx="325" cy="620" rx="25" ry="15" />
          <ellipse cx="375" cy="620" rx="25" ry="15" />
        </g>

        {(currentPhase === 'CIRCUIT_A' || currentPhase === 'CIRCUIT_B' || currentPhase === 'FIREWORKS' || currentPhase === 'ENDING' || currentPhase === 'ENDING_SMILE_EFFECT') && (
          <>
            <g role="list" aria-label="Connections between brain regions">
              {connectionsData.map((conn) => {
                const fromCoords = getRegionCoords(conn.from);
                const toCoords = getRegionCoords(conn.to);
                return (
                  <ConnectionPath
                    key={conn.id}
                    id={conn.id}
                    startX={fromCoords.x}
                    startY={fromCoords.y}
                    endX={toCoords.x}
                    endY={toCoords.y}
                    isActive={activeConnections.includes(conn.id)}
                    animationDuration={ANIMATION_STEP_DURATION}
                    activeColor={currentActiveColor}
                  />
                );
              })}
            </g>
            <g role="list" aria-label="Brain regions">
              {regionsData.map(region => (
                <BrainRegionNode
                  key={region.id}
                  {...region}
                  isActive={activeRegions.includes(region.id)}
                  activeColor={currentActiveColor}
                />
              ))}
            </g>
          </>
        )}
        {!allFireworksCyclesComplete && currentPhase !== 'ENDING' && currentPhase !== 'ENDING_SMILE_EFFECT' && (
          <Fireworks
            isActive={fireworksActive}
            centerX={fireworksCenter.x}
            centerY={fireworksCenter.y}
            sizeFactor={fireworksSizeFactor}
            baseColor={TARGET_B_COLOR_HSL} 
          />
        )}
      </svg>
    </div>
  );
};

export default BrainCircuitDiagram;