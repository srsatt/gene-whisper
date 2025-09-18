// src/components/DemographicsForm.tsx

import React from "react";
import type { Demographics, SexAtBirth } from "../models";
import { cn } from "../tools";

interface DemographicsFormProps {
  demographics: Demographics;
  onChange: (demographics: Demographics) => void;
  disabled?: boolean;
}

const SEX_OPTIONS: { value: SexAtBirth; label: string }[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Intersex", label: "Intersex" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

export default function DemographicsForm({
  demographics,
  onChange,
  disabled,
}: DemographicsFormProps) {
  const handleSexChange = (sexAtBirth: SexAtBirth) => {
    onChange({ ...demographics, sexAtBirth });
  };

  const handleAgeChange = (age: number | undefined) => {
    onChange({ ...demographics, age });
  };

  const handleWeightChange = (weight: number | undefined) => {
    onChange({ ...demographics, weight });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Sex at Birth */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Sex at Birth
        </label>
        <select
          value={demographics.sexAtBirth || ""}
          onChange={(e) => handleSexChange(e.target.value as SexAtBirth)}
          disabled={disabled}
          className={cn(
            "block w-full rounded-md border-gray-300 shadow-sm py-2 px-3",
            "focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
            disabled && "bg-gray-100 cursor-not-allowed"
          )}
          aria-label="Sex at birth"
        >
          <option value="">Select...</option>
          {SEX_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Age */}
      <div className="space-y-2">
        <label
          htmlFor="age"
          className="block text-sm font-medium text-gray-700"
        >
          Age
        </label>
        <input
          id="age"
          type="number"
          min="0"
          max="120"
          value={demographics.age || ""}
          onChange={(e) =>
            handleAgeChange(
              e.target.value ? parseInt(e.target.value, 10) : undefined
            )
          }
          disabled={disabled}
          className={cn(
            "block w-full rounded-md border-gray-300 shadow-sm py-2 px-3",
            "focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
            disabled && "bg-gray-100 cursor-not-allowed"
          )}
          placeholder="Enter your age"
          aria-label="Age in years"
        />
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <label
          htmlFor="weight"
          className="block text-sm font-medium text-gray-700"
        >
          Weight (kg)
        </label>
        <input
          id="weight"
          type="number"
          min="0"
          step="0.1"
          value={demographics.weight || ""}
          onChange={(e) =>
            handleWeightChange(
              e.target.value ? parseFloat(e.target.value) : undefined
            )
          }
          disabled={disabled}
          className={cn(
            "block w-full rounded-md border-gray-300 shadow-sm py-2 px-3",
            "focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
            disabled && "bg-gray-100 cursor-not-allowed"
          )}
          placeholder="Enter weight in kg"
          aria-label="Weight in kilograms"
        />
      </div>
    </div>
  );
}
