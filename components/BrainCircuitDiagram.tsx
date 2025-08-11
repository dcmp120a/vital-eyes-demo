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
  { id: 'pfc', name: '전전두피질 (Prefrontal Cortex)', abbreviation: 'PFC', x: 550, y: 150, radius: 60 },
  { id: 'sef', name: '보조안구영역 (Supplementary Eye Fields)', abbreviation: 'SEF', x: 500, y: 200, radius: 45 },
  { id: 'fef', name: '전두안구영역 (Frontal Eye Fields)', abbreviation: 'FEF', x: 600, y: 220, radius: 50 },
  { id: 'pef', name: '두정안구영역 (Parietal Eye Fields / PPC)', abbreviation: 'PEF/PPC', x: 400, y: 180, radius: 55 },
  { id: 'sc', name: '상구 (Superior Colliculus)', abbreviation: 'SC', x: 350, y: 450, radius: 50 },
  { id: 'bg', name: '기저핵 (Basal Ganglia)', abbreviation: 'BG', x: 450, y: 350, radius: 45 },
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
        <g opacity="0.4" fill="none" stroke="rgba(59, 130, 246, 0.7)" strokeWidth="2">
          {/* 대뇌 측면 윤곽선 */}
          <path d="M 100 80 Q 120 100 140 120 Q 160 140 180 160 Q 200 180 220 200 Q 240 220 260 240 Q 280 260 300 280 Q 320 300 340 320 Q 360 340 380 360 Q 400 380 420 400 Q 440 420 460 440 Q 480 460 500 480 Q 520 500 540 520 Q 560 540 580 560 Q 600 580 620 600 Q 640 620 660 640 Q 680 660 700 680 Q 720 700 740 720 Q 760 740 780 760 Q 800 780 820 800 Q 840 820 860 840 Q 880 860 900 880 Q 920 900 940 920 Q 960 940 980 960 Q 1000 980 1020 1000 Q 1040 1020 1060 1040 Q 1080 1060 1100 1080 Q 1120 1100 1140 1120 Q 1160 1140 1180 1160 Q 1200 1180 1220 1200 Q 1240 1220 1260 1240 Q 1280 1260 1300 1280 Q 1320 1300 1340 1320 Q 1360 1340 1380 1360 Q 1400 1380 1420 1400 Q 1440 1420 1460 1440 Q 1480 1460 1500 1480 Q 1520 1500 1540 1520 Q 1560 1540 1580 1560 Q 1600 1580 1620 1600 Q 1640 1620 1660 1640 Q 1680 1660 1700 1680 Q 1720 1700 1740 1720 Q 1760 1740 1780 1760 Q 1800 1780 1820 1800 Q 1840 1820 1860 1840 Q 1880 1860 1900 1880 Q 1920 1900 1940 1920 Q 1960 1940 1980 1960 Q 2000 1980 2020 2000 Q 2040 2020 2060 2040 Q 2080 2060 2100 2080 Q 2120 2100 2140 2120 Q 2160 2140 2180 2160 Q 2200 2180 2220 2200 Q 2240 2220 2260 2240 Q 2280 2260 2300 2280 Q 2320 2300 2340 2320 Q 2360 2340 2380 2360 Q 2400 2380 2420 2400 Q 2440 2420 2460 2440 Q 2480 2460 2500 2480 Q 2520 2500 2540 2520 Q 2560 2540 2580 2560 Q 2600 2580 2620 2600 Q 2640 2620 2660 2640 Q 2680 2660 2700 2680 Q 2720 2700 2740 2720 Q 2760 2740 2780 2760 Q 2800 2780 2820 2800 Q 2840 2820 2860 2840 Q 2880 2860 2900 2880 Q 2920 2900 2940 2920 Q 2960 2940 2980 2960 Q 3000 2980 3020 3000 Q 3040 3020 3060 3040 Q 3080 3060 3100 3080 Q 3120 3100 3140 3120 Q 3160 3140 3180 3160 Q 3200 3180 3220 3200 Q 3240 3220 3260 3240 Q 3280 3260 3300 3280 Q 3320 3300 3340 3320 Q 3360 3340 3380 3360 Q 3400 3380 3420 3400 Q 3440 3420 3460 3440 Q 3480 3460 3500 3480 Q 3520 3500 3540 3520 Q 3560 3540 3580 3560 Q 3600 3580 3620 3600 Q 3640 3620 3660 3640 Q 3680 3660 3700 3680 Q 3720 3700 3740 3720 Q 3760 3740 3780 3760 Q 3800 3780 3820 3800 Q 3840 3820 3860 3840 Q 3880 3860 3900 3880 Q 3920 3900 3940 3920 Q 3960 3940 3980 3960 Q 4000 3980 4020 4000 Q 4040 4020 4060 4040 Q 4080 4060 4100 4080 Q 4120 4100 4140 4120 Q 4160 4140 4180 4160 Q 4200 4180 4220 4200 Q 4240 4220 4260 4240 Q 4280 4260 4300 4280 Q 4320 4300 4340 4320 Q 4360 4340 4380 4360 Q 4400 4380 4420 4400 Q 4440 4420 4460 4440 Q 4480 4460 4500 4480 Q 4520 4500 4540 4520 Q 4560 4540 4580 4560 Q 4600 4580 4620 4600 Q 4640 4620 4660 4640 Q 4680 4660 4700 4680 Q 4720 4700 4740 4720 Q 4760 4740 4780 4760 Q 4800 4780 4820 4800 Q 4840 4820 4860 4840 Q 4880 4860 4900 4880 Q 4920 4900 4940 4920 Q 4960 4940 4980 4960 Q 5000 4980 5020 5000 Q 5040 5020 5060 5040 Q 5080 5060 5100 5080 Q 5120 5100 5140 5120 Q 5160 5140 5180 5160 Q 5200 5180 5220 5200 Q 5240 5220 5260 5240 Q 5280 5260 5300 5280 Q 5320 5300 5340 5320 Q 5360 5340 5380 5360 Q 5400 5380 5420 5400 Q 5440 5420 5460 5440 Q 5480 5460 5500 5480 Q 5520 5500 5540 5520 Q 5560 5540 5580 5560 Q 5600 5580 5620 5600 Q 5640 5620 5660 5640 Q 5680 5660 5700 5680 Q 5720 5700 5740 5720 Q 5760 5740 5780 5760 Q 5800 5780 5820 5800 Q 5840 5820 5860 5840 Q 5880 5860 5900 5880 Q 5920 5900 5940 5920 Q 5960 5940 5980 5960 Q 6000 5980 6020 6000 Q 6040 6020 6060 6040 Q 6080 6060 6100 6080 Q 6120 6100 6140 6120 Q 6160 6140 6180 6160 Q 6200 6180 6220 6200 Q 6240 6220 6260 6240 Q 6280 6260 6300 6280 Q 6320 6300 6340 6320 Q 6360 6340 6380 6360 Q 6400 6380 6420 6400 Q 6440 6420 6460 6440 Q 6480 6460 6500 6480 Z" />
          
          {/* 뇌간 */}
          <path d="M 300 560 L 320 580 L 340 600 L 360 620 L 380 640 L 400 660 L 420 680 L 440 700 L 460 720 L 480 740 L 500 760 L 520 780 L 540 800 L 560 820 L 580 840 L 600 860 L 620 880 L 640 900 L 660 920 L 680 940 L 700 960 L 720 980 L 740 1000 L 760 1020 L 780 1040 L 800 1060 L 820 1080 L 840 1100 L 860 1120 L 880 1140 L 900 1160 L 920 1180 L 940 1200 L 960 1220 L 980 1240 L 1000 1260 L 1020 1280 L 1040 1300 L 1060 1320 L 1080 1340 L 1100 1360 L 1120 1380 L 1140 1400 L 1160 1420 L 1180 1440 L 1200 1460 L 1220 1480 L 1240 1500 L 1260 1520 L 1280 1540 L 1300 1560 L 1320 1580 L 1340 1600 L 1360 1620 L 1380 1640 L 1400 1660 L 1420 1680 L 1440 1700 L 1460 1720 L 1480 1740 L 1500 1760 L 1520 1780 L 1540 1800 L 1560 1820 L 1580 1840 L 1600 1860 L 1620 1880 L 1640 1900 L 1660 1920 L 1680 1940 L 1700 1960 L 1720 1980 L 1740 2000 L 1760 2020 L 1780 2040 L 1800 2060 L 1820 2080 L 1840 2100 L 1860 2120 L 1880 2140 L 1900 2160 L 1920 2180 L 1940 2200 L 1960 2220 L 1980 2240 L 2000 2260 L 2020 2280 L 2040 2300 L 2060 2320 L 2080 2340 L 2100 2360 L 2120 2380 L 2140 2400 L 2160 2420 L 2180 2440 L 2200 2460 L 2220 2480 L 2240 2500 L 2260 2520 L 2280 2540 L 2300 2560 L 2320 2580 L 2340 2600 L 2360 2620 L 2380 2640 L 2400 2660 L 2420 2680 L 2440 2700 L 2460 2720 L 2480 2740 L 2500 2760 L 2520 2780 L 2540 2800 L 2560 2820 L 2580 2840 L 2600 2860 L 2620 2880 L 2640 2900 L 2660 2920 L 2680 2940 L 2700 2960 L 2720 2980 L 2740 3000 L 2760 3020 L 2780 3040 L 2800 3060 L 2820 3080 L 2840 3100 L 2860 3120 L 2880 3140 L 2900 3160 L 2920 3180 L 2940 3200 L 2960 3220 L 2980 3240 L 3000 3260 L 3020 3280 L 3040 3300 L 3060 3320 L 3080 3340 L 3100 3360 L 3120 3380 L 3140 3400 L 3160 3420 L 3180 3440 L 3200 3460 L 3220 3480 L 3240 3500 L 3260 3520 L 3280 3540 L 3300 3560 L 3320 3580 L 3340 3600 L 3360 3620 L 3380 3640 L 3400 3660 L 3420 3680 L 3440 3700 L 3460 3720 L 3480 3740 L 3500 3760 L 3520 3780 L 3540 3800 L 3560 3820 L 3580 3840 L 3600 3860 L 3620 3880 L 3640 3900 L 3660 3920 L 3680 3940 L 3700 3960 L 3720 3980 L 3740 4000 L 3760 4020 L 3780 4040 L 3800 4060 L 3820 4080 L 3840 4100 L 3860 4120 L 3880 4140 L 3900 4160 L 3920 4180 L 3940 4200 L 3960 4220 L 3980 4240 L 4000 4260 L 4020 4280 L 4040 4300 L 4060 4320 L 4080 4340 L 4100 4360 L 4120 4380 L 4140 4400 L 4160 4420 L 4180 4440 L 4200 4460 L 4220 4480 L 4240 4500 L 4260 4520 L 4280 4540 L 4300 4560 L 4320 4580 L 4340 4600 L 4360 4620 L 4380 4640 L 4400 4660 L 4420 4680 L 4440 4700 L 4460 4720 L 4480 4740 L 4500 4760 L 4520 4780 L 4540 4800 L 4560 4820 L 4580 4840 L 4600 4860 L 4620 4880 L 4640 4900 L 4660 4920 L 4680 4940 L 4700 4960 L 4720 4980 L 4740 5000 L 4760 5020 L 4780 5040 L 4800 5060 L 4820 5080 L 4840 5100 L 4860 5120 L 4880 5140 L 4900 5160 L 4920 5180 L 4940 5200 L 4960 5220 L 4980 5240 L 5000 5260 L 5020 5280 L 5040 5300 L 5060 5320 L 5080 5340 L 5100 5360 L 5120 5380 L 5140 5400 L 5160 5420 L 5180 5440 L 5200 5460 L 5220 5480 L 5240 5500 L 5260 5520 L 5280 5540 L 5300 5560 L 5320 5580 L 5340 5600 L 5360 5620 L 5380 5640 L 5400 5660 L 5420 5680 L 5440 5700 L 5460 5720 L 5480 5740 L 5500 5760 L 5520 5780 L 5540 5800 L 5560 5820 L 5580 5840 L 5600 5860 L 5620 5880 L 5640 5900 L 5660 5920 L 5680 5940 L 5700 5960 L 5720 5980 L 5740 6000 L 5760 6020 L 5780 6040 L 5800 6060 L 5820 6080 L 5840 6100 L 5860 6120 L 5880 6140 L 5900 6160 L 5920 6180 L 5940 6200 L 5960 6220 L 5980 6240 L 6000 6260 L 6020 6280 L 6040 6300 L 6060 6320 L 6080 6340 L 6100 6360 L 6120 6380 L 6140 6400 L 6160 6420 L 6180 6440 L 6200 6460 L 6220 6480 L 6240 6500 Z" />
          
          {/* 소뇌 */}
          <ellipse cx="325" cy="600" rx="25" ry="15" />
          <ellipse cx="375" cy="600" rx="25" ry="15" />
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