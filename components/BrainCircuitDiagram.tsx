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
  { id: 'pfc', name: '전전두피질 (Prefrontal Cortex)', abbreviation: 'PFC', x: 50, y: 38, radius: 15 },
  { id: 'sef', name: '보조안구영역 (Supplementary Eye Fields)', abbreviation: 'SEF', x: 38, y: 50, radius: 11 },
  { id: 'fef', name: '전두안구영역 (Frontal Eye Fields)', abbreviation: 'FEF', x: 62, y: 55, radius: 13 },
  { id: 'pef', name: '두정안구영역 (Parietal Eye Fields / PPC)', abbreviation: 'PEF/PPC', x: 112, y: 45, radius: 14 },
  { id: 'sc', name: '상구 (Superior Colliculus)', abbreviation: 'SC', x: 88, y: 112, radius: 13 },
  { id: 'bg', name: '기저핵 (Basal Ganglia)', abbreviation: 'BG', x: 62, y: 88, radius: 11 },
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

const SVG_WIDTH = 160;
const SVG_HEIGHT = 160;
const EYE_ANIMATION_AREA_HEIGHT = 30;

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

        {/* 3D 뇌 렌더링 배경 */}
        <g opacity="0.6" transform="scale(0.25)">
          {/* 전두엽 (분홍색) - 오른쪽 상단 */}
          <path d="M 400 100 Q 450 120 500 140 Q 550 160 580 180 Q 600 200 620 220 Q 640 240 650 260 Q 660 280 670 300 Q 680 320 690 340 Q 700 360 710 380 Q 720 400 730 420 Q 740 440 750 460 Q 760 480 770 500 Q 780 520 790 540 Q 800 560 810 580 Q 820 600 830 620 Q 840 640 850 660 Q 860 680 870 700 Q 880 720 890 740 Q 900 760 910 780 Q 920 800 930 820 Q 940 840 950 860 Q 960 880 970 900 Q 980 920 990 940 Q 1000 960 1010 980 Q 1020 1000 1030 1020 Q 1040 1040 1050 1060 Q 1060 1080 1070 1100 Q 1080 1120 1090 1140 Q 1100 1160 1110 1180 Q 1120 1200 1130 1220 Q 1140 1240 1150 1260 Q 1160 1280 1170 1300 Q 1180 1320 1190 1340 Q 1200 1360 1210 1380 Q 1220 1400 1230 1420 Q 1240 1440 1250 1460 Q 1260 1480 1270 1500 Q 1280 1520 1290 1540 Q 1300 1560 1310 1580 Q 1320 1600 1330 1620 Q 1340 1640 1350 1660 Q 1360 1680 1370 1700 Q 1380 1720 1390 1740 Q 1400 1760 1410 1780 Q 1420 1800 1430 1820 Q 1440 1840 1450 1860 Q 1460 1880 1470 1900 Q 1480 1920 1490 1940 Q 1500 1960 1510 1980 Q 1520 2000 1530 2020 Q 1540 2040 1550 2060 Q 1560 2080 1570 2100 Q 1580 2120 1590 2140 Q 1600 2160 1610 2180 Q 1620 2200 1630 2220 Q 1640 2240 1650 2260 Q 1660 2280 1670 2300 Q 1680 2320 1690 2340 Q 1700 2360 1710 2380 Q 1720 2400 1730 2420 Q 1740 2440 1750 2460 Q 1760 2480 1770 2500 Q 1780 2520 1790 2540 Q 1800 2560 1810 2580 Q 1820 2600 1830 2620 Q 1840 2640 1850 2660 Q 1860 2680 1870 2700 Q 1880 2720 1890 2740 Q 1900 2760 1910 2780 Q 1920 2800 1930 2820 Q 1940 2840 1950 2860 Q 1960 2880 1970 2900 Q 1980 2920 1990 2940 Q 2000 2960 2010 2980 Q 2020 3000 2030 3020 Q 2040 3040 2050 3060 Q 2060 3080 2070 3100 Q 2080 3120 2090 3140 Q 2100 3160 2110 3180 Q 2120 3200 2130 3220 Q 2140 3240 2150 3260 Q 2160 3280 2170 3300 Q 2180 3320 2190 3340 Q 2200 3360 2210 3380 Q 2220 3400 2230 3420 Q 2240 3440 2250 3460 Q 2260 3480 2270 3500 Q 2280 3520 2290 3540 Q 2300 3560 2310 3580 Q 2320 3600 2330 3620 Q 2340 3640 2350 3660 Q 2360 3680 2370 3700 Q 2380 3720 2390 3740 Q 2400 3760 2410 3780 Q 2420 3800 2430 3820 Q 2440 3840 2450 3860 Q 2460 3880 2470 3900 Q 2480 3920 2490 3940 Q 2500 3960 2510 3980 Q 2520 4000 2530 4020 Q 2540 4040 2550 4060 Q 2560 4080 2570 4100 Q 2580 4120 2590 4140 Q 2600 4160 2610 4180 Q 2620 4200 2630 4220 Q 2640 4240 2650 4260 Q 2660 4280 2670 4300 Q 2680 4320 2690 4340 Q 2700 4360 2710 4380 Q 2720 4400 2730 4420 Q 2740 4440 2750 4460 Q 2760 4480 2770 4500 Q 2780 4520 2790 4540 Q 2800 4560 2810 4580 Q 2820 4600 2830 4620 Q 2840 4640 2850 4660 Q 2860 4680 2870 4700 Q 2880 4720 2890 4740 Q 2900 4760 2910 4780 Q 2920 4800 2930 4820 Q 2940 4840 2950 4860 Q 2960 4880 2970 4900 Q 2980 4920 2990 4940 Q 3000 4960 3010 4980 Q 3020 5000 3030 5020 Q 3040 5040 3050 5060 Q 3060 5080 3070 5100 Q 3080 5120 3090 5140 Q 3100 5160 3110 5180 Q 3120 5200 3130 5220 Q 3140 5240 3150 5260 Q 3160 5280 3170 5300 Q 3180 5320 3190 5340 Q 3200 5360 3210 5380 Q 3220 5400 3230 5420 Q 3240 5440 3250 5460 Q 3260 5480 3270 5500 Q 3280 5520 3290 5540 Q 3300 5560 3310 5580 Q 3320 5600 3330 5620 Q 3340 5640 3350 5660 Q 3360 5680 3370 5700 Q 3380 5720 3390 5740 Q 3400 5760 3410 5780 Q 3420 5800 3430 5820 Q 3440 5840 3450 5860 Q 3460 5880 3470 5900 Q 3480 5920 3490 5940 Q 3500 5960 3510 5980 Q 3520 6000 3530 6020 Q 3540 6040 3550 6060 Q 3560 6080 3570 6100 Q 3580 6120 3590 6140 Q 3600 6160 3610 6180 Q 3620 6200 3630 6220 Q 3640 6240 3650 6260 Q 3660 6280 3670 6300 Q 3680 6320 3690 6340 Q 3700 6360 3710 6380 Q 3720 6400 3730 6420 Q 3740 6440 3750 6460 Q 3760 6480 3770 6500 Z" fill="rgba(255, 192, 203, 0.5)" />
          
          {/* 두정엽 (노란색) - 중앙 상단 */}
          <path d="M 300 150 Q 350 170 400 190 Q 450 210 500 230 Q 550 250 600 270 Q 650 290 700 310 Q 750 330 800 350 Q 850 370 900 390 Q 950 410 1000 430 Q 1050 450 1100 470 Q 1150 490 1200 510 Q 1250 530 1300 550 Q 1350 570 1400 590 Q 1450 610 1500 630 Q 1550 650 1600 670 Q 1650 690 1700 710 Q 1750 730 1800 750 Q 1850 770 1900 790 Q 1950 810 2000 830 Q 2050 850 2100 870 Q 2150 890 2200 910 Q 2250 930 2300 950 Q 2350 970 2400 990 Q 2450 1010 2500 1030 Q 2550 1050 2600 1070 Q 2650 1090 2700 1110 Q 2750 1130 2800 1150 Q 2850 1170 2900 1190 Q 2950 1210 3000 1230 Q 3050 1250 3100 1270 Q 3150 1290 3200 1310 Q 3250 1330 3300 1350 Q 3350 1370 3400 1390 Q 3450 1410 3500 1430 Q 3550 1450 3600 1470 Q 3650 1490 3700 1510 Q 3750 1530 3800 1550 Q 3850 1570 3900 1590 Q 3950 1610 4000 1630 Q 4050 1650 4100 1670 Q 4150 1690 4200 1710 Q 4250 1730 4300 1750 Q 4350 1770 4400 1790 Q 4450 1810 4500 1830 Q 4550 1850 4600 1870 Q 4650 1890 4700 1910 Q 4750 1930 4800 1950 Q 4850 1970 4900 1990 Q 4950 2010 5000 2030 Q 5050 2050 5100 2070 Q 5150 2090 5200 2110 Q 5250 2130 5300 2150 Q 5350 2170 5400 2190 Q 5450 2210 5500 2230 Q 5550 2250 5600 2270 Q 5650 2290 5700 2310 Q 5750 2330 5800 2350 Q 5850 2370 5900 2390 Q 5950 2410 6000 2430 Q 6050 2450 6100 2470 Q 6150 2490 6200 2510 Q 6250 2530 6300 2550 Q 6350 2570 6400 2590 Q 6450 2610 6500 2630 Z" fill="rgba(255, 255, 0, 0.5)" />
          
          {/* 측두엽 (초록색) - 중앙 하단 */}
          <path d="M 250 400 Q 300 420 350 440 Q 400 460 450 480 Q 500 500 550 520 Q 600 540 650 560 Q 700 580 750 600 Q 800 620 850 640 Q 900 660 950 680 Q 1000 700 1050 720 Q 1100 740 1150 760 Q 1200 780 1250 800 Q 1300 820 1350 840 Q 1400 860 1450 880 Q 1500 900 1550 920 Q 1600 940 1650 960 Q 1700 980 1750 1000 Q 1800 1020 1850 1040 Q 1900 1060 1950 1080 Q 2000 1100 2050 1120 Q 2100 1140 2150 1160 Q 2200 1180 2250 1200 Q 2300 1220 2350 1240 Q 2400 1260 2450 1280 Q 2500 1300 2550 1320 Q 2600 1340 2650 1360 Q 2700 1380 2750 1400 Q 2800 1420 2850 1440 Q 2900 1460 2950 1480 Q 3000 1500 3050 1520 Q 3100 1540 3150 1560 Q 3200 1580 3250 1600 Q 3300 1620 3350 1640 Q 3400 1660 3450 1680 Q 3500 1700 3550 1720 Q 3600 1740 3650 1760 Q 3700 1780 3750 1800 Q 3800 1820 3850 1840 Q 3900 1860 3950 1880 Q 4000 1900 4050 1920 Q 4100 1940 4150 1960 Q 4200 1980 4250 2000 Q 4300 2020 4350 2040 Q 4400 2060 4450 2080 Q 4500 2100 4550 2120 Q 4600 2140 4650 2160 Q 4700 2180 4750 2200 Q 4800 2220 4850 2240 Q 4900 2260 4950 2280 Q 5000 2300 5050 2320 Q 5100 2340 5150 2360 Q 5200 2380 5250 2400 Q 5300 2420 5350 2440 Q 5400 2460 5450 2480 Q 5500 2500 5550 2520 Q 5600 2540 5650 2560 Q 5700 2580 5750 2600 Q 5800 2620 5850 2640 Q 5900 2660 5950 2680 Q 6000 2700 6050 2720 Q 6100 2740 6150 2760 Q 6200 2780 6250 2800 Q 6300 2820 6350 2840 Q 6400 2860 6450 2880 Q 6500 2900 6550 2920 Z" fill="rgba(0, 255, 0, 0.5)" />
          
          {/* 후두엽 (보라색) - 왼쪽 상단 */}
          <path d="M 100 200 Q 150 220 200 240 Q 250 260 300 280 Q 350 300 400 320 Q 450 340 500 360 Q 550 380 600 400 Q 650 420 700 440 Q 750 460 800 480 Q 850 500 900 520 Q 950 540 1000 560 Q 1050 580 1100 600 Q 1150 620 1200 640 Q 1250 660 1300 680 Q 1350 700 1400 720 Q 1450 740 1500 760 Q 1550 780 1600 800 Q 1650 820 1700 840 Q 1750 860 1800 880 Q 1850 900 1900 920 Q 1950 940 2000 960 Q 2050 980 2100 1000 Q 2150 1020 2200 1040 Q 2250 1060 2300 1080 Q 2350 1100 2400 1120 Q 2450 1140 2500 1160 Q 2550 1180 2600 1200 Q 2650 1220 2700 1240 Q 2750 1260 2800 1280 Q 2850 1300 2900 1320 Q 2950 1340 3000 1360 Q 3050 1380 3100 1400 Q 3150 1420 3200 1440 Q 3250 1460 3300 1480 Q 3350 1500 3400 1520 Q 3450 1540 3500 1560 Q 3550 1580 3600 1600 Q 3650 1620 3700 1640 Q 3750 1660 3800 1680 Q 3850 1700 3900 1720 Q 3950 1740 4000 1760 Q 4050 1780 4100 1800 Q 4150 1820 4200 1840 Q 4250 1860 4300 1880 Q 4350 1900 4400 1920 Q 4450 1940 4500 1960 Q 4550 1980 4600 2000 Q 4650 2020 4700 2040 Q 4750 2060 4800 2080 Q 4850 2100 4900 2120 Q 4950 2140 5000 2160 Q 5050 2180 5100 2200 Q 5150 2220 5200 2240 Q 5250 2260 5300 2280 Q 5350 2300 5400 2320 Q 5450 2340 5500 2360 Q 5550 2380 5600 2400 Q 5650 2420 5700 2440 Q 5750 2460 5800 2480 Q 5850 2500 5900 2520 Q 5950 2540 6000 2560 Z" fill="rgba(128, 0, 128, 0.5)" />
          
          {/* 소뇌 (파란색) - 왼쪽 하단 */}
          <ellipse cx="200" cy="550" rx="80" ry="60" fill="rgba(0, 0, 255, 0.5)" />
          
          {/* 뇌간 (투명한 푸른색) - 중앙 하단 */}
          <path d="M 300 500 L 350 520 L 400 540 L 450 560 L 500 580 L 550 600 L 600 620 L 650 640 L 700 660 L 750 680 L 800 700 L 850 720 L 900 740 L 950 760 L 1000 780 L 1050 800 L 1100 820 L 1150 840 L 1200 860 L 1250 880 L 1300 900 L 1350 920 L 1400 940 L 1450 960 L 1500 980 L 1550 1000 L 1600 1020 L 1650 1040 L 1700 1060 L 1750 1080 L 1800 1100 L 1850 1120 L 1900 1140 L 1950 1160 L 2000 1180 L 2050 1200 L 2100 1220 L 2150 1240 L 2200 1260 L 2250 1280 L 2300 1300 L 2350 1320 L 2400 1340 L 2450 1360 L 2500 1380 L 2550 1400 L 2600 1420 L 2650 1440 L 2700 1460 L 2750 1480 L 2800 1500 L 2850 1520 L 2900 1540 L 2950 1560 L 3000 1580 L 3050 1600 L 3100 1620 L 3150 1640 L 3200 1660 L 3250 1680 L 3300 1700 L 3350 1720 L 3400 1740 L 3450 1760 L 3500 1780 L 3550 1800 L 3600 1820 L 3650 1840 L 3700 1860 L 3750 1880 L 3800 1900 L 3850 1920 L 3900 1940 L 3950 1960 L 4000 1980 L 4050 2000 L 4100 2020 L 4150 2040 L 4200 2060 L 4250 2080 L 4300 2100 L 4350 2120 L 4400 2140 L 4450 2160 L 4500 2180 L 4550 2200 L 4600 2220 L 4650 2240 L 4700 2260 L 4750 2280 L 4800 2300 L 4850 2320 L 4900 2340 L 4950 2360 L 5000 2380 L 5050 2400 L 5100 2420 L 5150 2440 L 5200 2460 L 5250 2480 L 5300 2500 L 5350 2520 L 5400 2540 L 5450 2560 L 5500 2580 L 5550 2600 L 5600 2620 L 5650 2640 L 5700 2660 L 5750 2680 L 5800 2700 L 5850 2720 L 5900 2740 L 5950 2760 L 6000 2780 L 6050 2800 L 6100 2820 L 6150 2840 L 6200 2860 L 6250 2880 L 6300 2900 L 6350 2920 L 6400 2940 L 6450 2960 L 6500 2980 L 6550 3000 Z" stroke="rgba(0, 191, 255, 0.7)" strokeWidth="4" fill="none" />
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