import React, { useState, useEffect, useRef } from 'react';

interface ConnectionPathProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive: boolean;
  animationDuration: number;
  activeColor: string; // HSL format string
}

const ConnectionPath: React.FC<ConnectionPathProps> = ({ id, startX, startY, endX, endY, isActive, animationDuration, activeColor }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
      if (isActive) {
        pathRef.current.style.transitionDuration = '0ms';
        pathRef.current.style.strokeDashoffset = String(length);
        void pathRef.current.getBoundingClientRect();
        pathRef.current.style.transitionDuration = `${animationDuration}ms`;
        pathRef.current.style.strokeDashoffset = '0';
      } else {
        // Ensure it resets quickly and smoothly if deactivated mid-animation
        pathRef.current.style.transitionDuration = `150ms`; // Quick fade/hide
        pathRef.current.style.strokeDashoffset = String(length);
      }
    }
  }, [startX, startY, endX, endY, isActive, animationDuration]);

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const controlX = midX;
  let controlY = startY - Math.abs(startY - endY) * 0.1 - 10;

  if (Math.abs(startY - endY) < 25) {
     controlY = startY - 30 - Math.abs(startX - endX) * 0.05;
  } else if (startY > endY) {
     controlY = midY + Math.abs(startY - endY) * 0.15 + 15;
  }

  const d = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

  return (
    <path
      ref={pathRef}
      id={id}
      d={d}
      fill="none"
      stroke={isActive ? activeColor : 'rgba(59, 130, 246, 0.3)'} // Use activeColor or light blue default
      strokeWidth={isActive ? 1.7 : 1.0}
      strokeDasharray={pathLength}
      strokeDashoffset={pathLength}
      className="path-draw-animation"
      // transition-delay is not needed here, parent controls sequence
    />
  );
};

export default ConnectionPath;
