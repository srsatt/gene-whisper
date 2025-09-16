// src/components/RiskMeter.tsx

import React from 'react';
import { cn } from '../tools';

interface RiskMeterProps {
  value: number; // 0-100
  label: string;
  uncertaintyRange?: [number, number];
  className?: string;
}

export default function RiskMeter({ value, label, uncertaintyRange, className }: RiskMeterProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const [minUncertainty, maxUncertainty] = uncertaintyRange || [clampedValue, clampedValue];
  
  const getRiskColor = (val: number) => {
    if (val < 30) return 'bg-green-500';
    if (val < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getRiskLabel = (val: number) => {
    if (val < 30) return 'Low';
    if (val < 70) return 'Moderate';
    return 'High';
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(clampedValue)}%
          </span>
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            clampedValue < 30 
              ? "bg-green-100 text-green-800"
              : clampedValue < 70
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          )}>
            {getRiskLabel(clampedValue)}
          </span>
        </div>
      </div>
      
      <div 
        className="relative h-3 bg-gray-200 rounded-full overflow-hidden"
        role="meter"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${Math.round(clampedValue)}% risk`}
      >
        {/* Uncertainty band */}
        {uncertaintyRange && (
          <div
            className="absolute top-0 h-full bg-gray-300 opacity-50"
            style={{
              left: `${minUncertainty}%`,
              width: `${Math.max(0, maxUncertainty - minUncertainty)}%`
            }}
          />
        )}
        
        {/* Risk bar */}
        <div
          className={cn(
            "absolute top-0 h-full transition-all duration-500 ease-out",
            getRiskColor(clampedValue)
          )}
          style={{ width: `${clampedValue}%` }}
        />
        
        {/* Indicator dot */}
        <div
          className="absolute top-0 h-full w-1 bg-gray-800 opacity-75 transition-all duration-500"
          style={{ left: `${clampedValue}%` }}
        />
      </div>
      
      {uncertaintyRange && (
        <p className="text-xs text-gray-500">
          Uncertainty range: {Math.round(minUncertainty)}% - {Math.round(maxUncertainty)}%
        </p>
      )}
    </div>
  );
}
