
import React, { useEffect, useState, useRef } from 'react';

interface EyeSaccadeAnimationProps {
  targetSide: 'A' | 'B';
  onAnimationComplete: () => void;
  isActivelyMoving: boolean;
  showSmilingFace: boolean;
  triggerSmileSpreadEffect: boolean;
  onSmileSpreadEffectComplete: () => void;
  smileSpreadAnimationDurationMs: number;
  width: number;
  height: number;
  targetAColor: string;
  targetBColor: string;
}

const TARGET_SIZE = 25;
const PADDING = 20;
const MOVEMENT_DURATION = 333;
const PAUSE_DURATION = 100;
const SMILE_ANIMATION_DURATION = 533;

const NUM_RIPPLE_RINGS = 5;
const RIPPLE_DELAY_MS = 120;


const EyeSaccadeAnimation: React.FC<EyeSaccadeAnimationProps> = ({
  targetSide,
  onAnimationComplete,
  isActivelyMoving,
  showSmilingFace,
  triggerSmileSpreadEffect,
  onSmileSpreadEffectComplete,
  smileSpreadAnimationDurationMs,
  width,
  height,
  targetAColor,
  targetBColor,
}) => {
  const headCenterX = width / 2;
  const headCenterY = height / 2 + 20; // 얼굴 이미지를 아래로 이동

  const HEAD_RADIUS = Math.min(width / 4, height / 2.5);
  const IRIS_RADIUS = HEAD_RADIUS * 0.35;
  const PUPIL_RADIUS = IRIS_RADIUS * 0.5;
  const EYE_OFFSET_X_FROM_HEAD_CENTER = HEAD_RADIUS * 0.4;
  const PUPIL_MAX_SHIFT = IRIS_RADIUS - PUPIL_RADIUS - IRIS_RADIUS * 0.1;
  const SMILE_Y_OFFSET = HEAD_RADIUS * 0.45;
  const SMILE_WIDTH = HEAD_RADIUS * 0.8;
  const SMILE_CURVE_DEPTH = HEAD_RADIUS * 0.3;

  const [pupilShift, setPupilShift] = useState(0);
  const [initialSideProcessed, setInitialSideProcessed] = useState(false);
  const [currentTargetDisplay, setCurrentTargetDisplay] = useState<'A' | 'B'>(targetSide);
  const [textOpacity, setTextOpacity] = useState(1);
  const [smilePathLength, setSmilePathLength] = useState(0);
  
  const [activeRippleRings, setActiveRippleRings] = useState<number[]>([]);
  const rippleTimeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const masterRippleTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);


  const targetAX = PADDING + TARGET_SIZE / 2;
  const targetBX = width - PADDING - TARGET_SIZE / 2;

  const leftPupilGroupRef = useRef<SVGGElement>(null);
  const rightPupilGroupRef = useRef<SVGGElement>(null);
  const smilePathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (smilePathRef.current) {
        const length = smilePathRef.current.getTotalLength();
        setSmilePathLength(length);
        smilePathRef.current.style.strokeDasharray = `${length}`;
        smilePathRef.current.style.strokeDashoffset = `${length}`;
    }
  }, [showSmilingFace]);


  useEffect(() => {
    let movementTimer: NodeJS.Timeout | undefined;
    let rafId: number | undefined;

    const clearRippleTimeouts = () => {
        rippleTimeoutIdsRef.current.forEach(clearTimeout);
        rippleTimeoutIdsRef.current = [];
        if (masterRippleTimeoutIdRef.current) {
            clearTimeout(masterRippleTimeoutIdRef.current);
            masterRippleTimeoutIdRef.current = null;
        }
    };

    if (showSmilingFace) {
      setTextOpacity(0);
      const happyPupilShift = PUPIL_MAX_SHIFT * -0.1;

      if (leftPupilGroupRef.current) {
        leftPupilGroupRef.current.style.transition = `transform ${MOVEMENT_DURATION}ms ease-out`;
        leftPupilGroupRef.current.style.transform = `translateX(0px) translateY(${happyPupilShift}px)`;
      }
      if (rightPupilGroupRef.current) {
        rightPupilGroupRef.current.style.transition = `transform ${MOVEMENT_DURATION}ms ease-out`;
        rightPupilGroupRef.current.style.transform = `translateX(0px) translateY(${happyPupilShift}px)`;
      }
      setPupilShift(0);

      if (smilePathRef.current) {
        smilePathRef.current.style.transition = `stroke-dashoffset ${SMILE_ANIMATION_DURATION}ms ease-out ${MOVEMENT_DURATION * 0.5}ms`;
        smilePathRef.current.style.strokeDashoffset = '0';
      }

      if (triggerSmileSpreadEffect) {
        clearRippleTimeouts(); // Clear any existing timeouts
        const newTimeouts: NodeJS.Timeout[] = [];
        for (let i = 0; i < NUM_RIPPLE_RINGS; i++) {
            const timeoutId = setTimeout(() => {
                setActiveRippleRings(prev => [...prev, i]);
            }, i * RIPPLE_DELAY_MS);
            newTimeouts.push(timeoutId);
        }
        rippleTimeoutIdsRef.current = newTimeouts;

        const totalRippleDuration = smileSpreadAnimationDurationMs + (NUM_RIPPLE_RINGS - 1) * RIPPLE_DELAY_MS;
        masterRippleTimeoutIdRef.current = setTimeout(() => {
            onSmileSpreadEffectComplete(); 
            setActiveRippleRings([]);      
        }, totalRippleDuration);

      } else {
        clearRippleTimeouts();
        setActiveRippleRings([]);
      }

    } else { // Not showSmilingFace
      setTextOpacity(1);
      if (smilePathRef.current) {
          smilePathRef.current.style.transition = 'none';
          smilePathRef.current.style.strokeDashoffset = `${smilePathLength}`;
      }
      clearRippleTimeouts();
      setActiveRippleRings([]); 

      // Regular eye movement logic
      setCurrentTargetDisplay(targetSide);
      const targetPupilShift = targetSide === 'A' ? -PUPIL_MAX_SHIFT : PUPIL_MAX_SHIFT;

      if (isActivelyMoving) {
        let startingPupilShiftForAnimation = pupilShift;

        if (!initialSideProcessed) {
          startingPupilShiftForAnimation = -targetPupilShift;
          if (leftPupilGroupRef.current) {
            leftPupilGroupRef.current.style.transition = 'none';
            leftPupilGroupRef.current.style.transform = `translateX(${startingPupilShiftForAnimation}px)`;
          }
          if (rightPupilGroupRef.current) {
            rightPupilGroupRef.current.style.transition = 'none';
            rightPupilGroupRef.current.style.transform = `translateX(${startingPupilShiftForAnimation}px)`;
          }
          rafId = requestAnimationFrame(() => {
            if (leftPupilGroupRef.current) {
              leftPupilGroupRef.current.style.transition = `transform ${MOVEMENT_DURATION}ms ease-in-out`;
              leftPupilGroupRef.current.style.transform = `translateX(${targetPupilShift}px)`;
            }
            if (rightPupilGroupRef.current) {
              rightPupilGroupRef.current.style.transition = `transform ${MOVEMENT_DURATION}ms ease-in-out`;
              rightPupilGroupRef.current.style.transform = `translateX(${targetPupilShift}px)`;
            }
            setPupilShift(targetPupilShift);
            setInitialSideProcessed(true);
          });
        } else {
          if (leftPupilGroupRef.current) {
            leftPupilGroupRef.current.style.transition = `transform ${MOVEMENT_DURATION}ms ease-in-out`;
            leftPupilGroupRef.current.style.transform = `translateX(${targetPupilShift}px)`;
          }
          if (rightPupilGroupRef.current) {
            rightPupilGroupRef.current.style.transition = `transform ${MOVEMENT_DURATION}ms ease-in-out`;
            rightPupilGroupRef.current.style.transform = `translateX(${targetPupilShift}px)`;
          }
          setPupilShift(targetPupilShift);
        }
        movementTimer = setTimeout(() => {
          if (!showSmilingFace) onAnimationComplete();
        }, MOVEMENT_DURATION + PAUSE_DURATION);
      } else { // Not actively moving
        if (leftPupilGroupRef.current) {
          leftPupilGroupRef.current.style.transition = 'none';
          leftPupilGroupRef.current.style.transform = `translateX(${targetPupilShift}px)`;
        }
        if (rightPupilGroupRef.current) {
          rightPupilGroupRef.current.style.transition = 'none';
          rightPupilGroupRef.current.style.transform = `translateX(${targetPupilShift}px)`;
        }
        setPupilShift(targetPupilShift);
        setInitialSideProcessed(false);
      }
    }
    return () => {
        if (movementTimer) clearTimeout(movementTimer);
        if (rafId) cancelAnimationFrame(rafId);
        clearRippleTimeouts();
    };
  }, [
    targetSide, isActivelyMoving, onAnimationComplete,
    PUPIL_MAX_SHIFT, initialSideProcessed, MOVEMENT_DURATION,
    showSmilingFace, SMILE_ANIMATION_DURATION, triggerSmileSpreadEffect,
    onSmileSpreadEffectComplete, smileSpreadAnimationDurationMs, smilePathLength,
    width, height, HEAD_RADIUS // HEAD_RADIUS used for keyframes calculations via initialRingRadius etc.
  ]);

  const pupilTransform = `translateX(${pupilShift}px)`;
  const smileD = `M ${headCenterX - SMILE_WIDTH / 2} ${headCenterY + SMILE_Y_OFFSET} Q ${headCenterX} ${headCenterY + SMILE_Y_OFFSET + SMILE_CURVE_DEPTH} ${headCenterX + SMILE_WIDTH / 2} ${headCenterY + SMILE_Y_OFFSET}`;

  const initialRingRadius = HEAD_RADIUS * 0.6;
  const initialRingStrokeWidth = 5;
  const finalRingRadius = width * 0.75; 
  const finalRingStrokeWidth = 0.5;


  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full rounded-md overflow-hidden bg-white border border-gray-200" aria-label="Eye saccade animation - top down view">
      <defs>
        <filter id="eyeGlowSaccadeTopDown" x="-75%" y="-75%" width="250%" height="250%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="neonRingGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feFlood floodColor="hsl(210, 100%, 70%)" floodOpacity="0.75" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="glow"/>
            <feMerge>
                <feMergeNode in="glow"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>
      <style>{`
        @keyframes neonRingSpreadKeyframes {
          0% {
            r: ${initialRingRadius}px;
            opacity: 1;
            stroke-width: ${initialRingStrokeWidth}px;
          }
          100% {
            r: ${finalRingRadius}px;
            opacity: 0;
            stroke-width: ${finalRingStrokeWidth}px;
          }
        }
        .neon-ring-animate {
          animation: neonRingSpreadKeyframes ${smileSpreadAnimationDurationMs}ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>

      <g style={{ opacity: textOpacity, transition: `opacity ${SMILE_ANIMATION_DURATION * 0.5}ms ease-out` }}>
        <rect
          x={PADDING}
          y={height / 2 - TARGET_SIZE / 2}
          width={TARGET_SIZE}
          height={TARGET_SIZE}
          fill={currentTargetDisplay === 'A' ? targetAColor : targetAColor.replace(/(\d+)%\)/, (match, p1) => `${Math.max(20, parseInt(p1)-30)}%)`)}
          rx="4"
          className="transition-colors duration-200"
          aria-label="Target A"
        />
        <text x={targetAX} y={height/2 + TARGET_SIZE + 12} textAnchor="middle" fontSize="10" fontWeight="bold" className="fill-gray-700">TARGET A</text>

        <rect
          x={width - PADDING - TARGET_SIZE}
          y={height / 2 - TARGET_SIZE / 2}
          width={TARGET_SIZE}
          height={TARGET_SIZE}
          fill={currentTargetDisplay === 'B' ? targetBColor : targetBColor.replace(/(\d+)%\)/, (match, p1) => `${Math.max(20, parseInt(p1)-30)}%)`)}
          rx="4"
          className="transition-colors duration-200"
          aria-label="Target B"
        />
        <text x={targetBX} y={height/2 + TARGET_SIZE + 12} textAnchor="middle" fontSize="10" fontWeight="bold" className="fill-gray-700">TARGET B</text>
        <text x={width/2} y={PADDING - 2} textAnchor="middle" fontSize="10" className="fill-gray-700 uppercase tracking-wider">Saccadic Eye Movement</text>
      </g>

      <circle
        cx={headCenterX}
        cy={headCenterY}
        r={HEAD_RADIUS}
        fill="gray-200"
        stroke="gray-300"
        strokeWidth="2"
      />

      {/* Left Eye */}
      <g transform={`translate(${headCenterX - EYE_OFFSET_X_FROM_HEAD_CENTER}, ${headCenterY})`}>
        <circle
          cx="0"
          cy="0"
          r={IRIS_RADIUS}
          fill="hsl(210, 60%, 70%)"
          stroke="hsl(210, 50%, 50%)"
          strokeWidth="1"
          filter="url(#eyeGlowSaccadeTopDown)"
        />
        <g ref={leftPupilGroupRef} style={{ transform: pupilTransform }}>
          <circle
            cx="0"
            cy="0"
            r={PUPIL_RADIUS}
            fill="gray-800"
          />
        </g>
      </g>

      {/* Right Eye */}
      <g transform={`translate(${headCenterX + EYE_OFFSET_X_FROM_HEAD_CENTER}, ${headCenterY})`}>
        <circle
          cx="0"
          cy="0"
          r={IRIS_RADIUS}
          fill="hsl(210, 60%, 70%)"
          stroke="hsl(210, 50%, 50%)"
          strokeWidth="1"
          filter="url(#eyeGlowSaccadeTopDown)"
        />
         <g ref={rightPupilGroupRef} style={{ transform: pupilTransform }}>
          <circle
            cx="0"
            cy="0"
            r={PUPIL_RADIUS}
            fill="gray-800"
          />
        </g>
      </g>

      {showSmilingFace && (
        <path
          ref={smilePathRef}
          d={smileD}
          fill="none"
          stroke="hsl(210, 80%, 60%)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ strokeDasharray: smilePathLength, strokeDashoffset: smilePathLength }}
        />
      )}
      
      {Array.from({ length: NUM_RIPPLE_RINGS }).map((_, index) => (
        <circle
          key={`ripple-ring-${index}`}
          cx={headCenterX}
          cy={headCenterY}
          r={initialRingRadius} 
          fill="none"
          stroke="hsl(210, 90%, 60%)" 
          strokeWidth={initialRingStrokeWidth} 
          opacity={0} 
          filter="url(#neonRingGlow)"
          className={activeRippleRings.includes(index) ? 'neon-ring-animate' : ''}
        />
      ))}
    </svg>
  );
};

export default EyeSaccadeAnimation;
