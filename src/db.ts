// src/db.ts

import type { Demographics, Report, EvidenceLevel } from './models';

const STORAGE_KEYS = {
  DEMOGRAPHICS: 'gene-whisper-demographics',
  LAST_REPORT: 'gene-whisper-last-report',
  UI_PREFERENCES: 'gene-whisper-ui-preferences'
} as const;


export function saveDemographics(demographics: Demographics): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEMOGRAPHICS, JSON.stringify(demographics));
  } catch (error) {
    console.warn('Failed to save demographics:', error);
  }
}

export function getDemographics(): Demographics {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DEMOGRAPHICS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to get demographics:', error);
  }
  return {};
}

export function saveReport(report: Report): void {
  try {
    const reportToSave = {
      ...report,
      generatedAt: report.generatedAt.toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.LAST_REPORT, JSON.stringify(reportToSave));
  } catch (error) {
    console.warn('Failed to save report:', error);
  }
}

export function getLastReport(): Report | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_REPORT);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        generatedAt: new Date(parsed.generatedAt)
      };
    }
  } catch (error) {
    console.warn('Failed to get last report:', error);
  }
  return null;
}

export interface UIPreferences {
  evidenceExpanded: Record<EvidenceLevel, boolean>;
  chatOpen: boolean;
}

export function saveUIPreferences(preferences: Partial<UIPreferences>): void {
  try {
    const current = getUIPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEYS.UI_PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save UI preferences:', error);
  }
}

export function getUIPreferences(): UIPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UI_PREFERENCES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to get UI preferences:', error);
  }
  return {
    evidenceExpanded: { A: true, B: true, C: false },
    chatOpen: false
  };
}

export function clearAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear data:', error);
  }
}