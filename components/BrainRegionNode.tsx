
import React from 'react';

interface BrainRegionNodeProps {
  id: string;
  name: string;
  abbreviation: string;
  x: number;
  y: number;
  radius?: number;
  isActive?: boolean;
  activeColor?: string; // HSL format string
}

const BrainRegionNode: React.FC<BrainRegionNodeProps> = ({ id, name, abbreviation, x, y, radius = 45, isActive = false, activeColor = 'hsl(220, 70%, 60%)' }) => {
  // Base color is a neutral blue if not active
  const baseFillColor = 'fill-blue-500';
  const baseStrokeColor = 'stroke-blue-300';
  
  // If active, use the provided activeColor. Otherwise, use base colors.
  const nodeFill = isActive ? activeColor : baseFillColor.split('-')[1] + '-' + baseFillColor.split('-')[2]; // Use HSL string directly for fill
  const nodeStroke = isActive 
    ? activeColor.replace(/(\d+)%\)/, (match, p1) => `${Math.min(100, parseInt(p1) + 15)}%)`) // Lighten active color for stroke
    : baseStrokeColor;
  
  const textColor = isActive ? 'fill-white' : 'fill-white';
  
  return (
    <g transform={`translate(${x}, ${y})`} className="cursor-pointer group">
      <title>{name}</title>
      <circle
        r={radius}
        fill={isActive ? nodeFill : undefined} // Apply HSL string directly
        stroke={isActive ? nodeStroke : undefined}
        className={`${isActive ? '' : baseFillColor + ' ' + baseStrokeColor} stroke-2 group-hover:fill-blue-600 transition-all duration-300 ease-in-out`}
        filter={isActive ? "url(#glow)" : ""}
      />
      <text
        textAnchor="middle"
        dy=".3em"
        className={`${textColor} font-semibold text-lg select-none pointer-events-none transition-colors duration-300`}
      >
        {abbreviation}
      </text>
    </g>
  );
};

export default BrainRegionNode;
