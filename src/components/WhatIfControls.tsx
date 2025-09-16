// src/components/WhatIfControls.tsx

import React from 'react';
import type { WhatIf } from '../models';
import { cn } from '../tools';

interface WhatIfControlsProps {
  whatIfs: WhatIf[];
  values: Record<string, number | boolean>;
  onChange: (values: Record<string, number | boolean>) => void;
  disabled?: boolean;
}

export default function WhatIfControls({ whatIfs, values, onChange, disabled }: WhatIfControlsProps) {
  if (whatIfs.length === 0) return null;

  const handleToggleChange = (id: string, checked: boolean) => {
    onChange({ ...values, [id]: checked });
  };

  const handleSliderChange = (id: string, value: number) => {
    onChange({ ...values, [id]: value });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">
        What-if scenarios
      </h4>
      <p className="text-xs text-gray-500">
        Adjust these factors to see how they might affect your risk
      </p>
      
      <div className="space-y-3">
        {whatIfs.map((whatIf) => (
          <div key={whatIf.id} className="space-y-2">
            <label className="block text-sm text-gray-700">
              {whatIf.label}
            </label>
            
            {whatIf.type === 'toggle' ? (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[whatIf.id])}
                  onChange={(e) => handleToggleChange(whatIf.id, e.target.checked)}
                  disabled={disabled}
                  className={cn(
                    "rounded border-gray-300 text-blue-600",
                    "focus:ring-blue-500 focus:ring-offset-0",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                  aria-describedby={`${whatIf.id}-description`}
                />
                <span className="text-sm text-gray-600">
                  {Boolean(values[whatIf.id]) ? 'Yes' : 'No'}
                </span>
              </label>
            ) : (
              <div className="space-y-1">
                <input
                  type="range"
                  min={whatIf.range?.[0] || 0}
                  max={whatIf.range?.[1] || 100}
                  step={whatIf.step || 1}
                  value={Number(values[whatIf.id]) || whatIf.range?.[0] || 0}
                  onChange={(e) => handleSliderChange(whatIf.id, parseFloat(e.target.value))}
                  disabled={disabled}
                  className={cn(
                    "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "slider:bg-blue-600 slider:appearance-none slider:h-4 slider:w-4 slider:rounded-full",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                  aria-label={whatIf.label}
                  aria-describedby={`${whatIf.id}-value`}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{whatIf.range?.[0] || 0}{whatIf.unit}</span>
                  <span id={`${whatIf.id}-value`} className="font-medium text-gray-700">
                    {Number(values[whatIf.id]) || whatIf.range?.[0] || 0}{whatIf.unit}
                  </span>
                  <span>{whatIf.range?.[1] || 100}{whatIf.unit}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
