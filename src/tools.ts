// src/tools.ts

export function adjustRiskScore(base: number, whatIf: Record<string, number | boolean>): number {
  let adjusted = base;
  
  // Apply what-if adjustments (mock calculations)
  Object.entries(whatIf).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      // Toggle adjustments
      if (key.includes('smoking') && value) adjusted += 15;
      if (key.includes('exercise') && value) adjusted -= 8;
      if (key.includes('medication') && value) adjusted -= 12;
    } else if (typeof value === 'number') {
      // Slider adjustments
      if (key.includes('bmi')) {
        const bmiEffect = Math.max(0, (value - 25) * 2);
        adjusted += bmiEffect;
      }
      if (key.includes('alcohol')) {
        adjusted += value * 3;
      }
    }
  });
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, adjusted));
}

export function formatAbsoluteRisk(age?: number): string {
  if (!age) return "Risk varies by age and other factors";
  
  // Mock absolute risk formatting
  if (age < 30) return "Very low absolute risk at your age";
  if (age < 50) return `~${Math.round(age * 0.1)}% lifetime risk`;
  if (age < 70) return `~${Math.round(age * 0.2)}% lifetime risk`;
  return `~${Math.round(age * 0.3)}% lifetime risk`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}