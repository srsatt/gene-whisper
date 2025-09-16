// src/models.ts

export type Vendor = '23andMe' | 'MyHeritage' | 'Ancestry' | 'Generic VCF';

export type EvidenceLevel = 'A' | 'B' | 'C';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export type SexAtBirth = 'Male' | 'Female' | 'Intersex' | 'Prefer not to say';

export interface Demographics {
  sexAtBirth?: SexAtBirth;
  age?: number;
  weight?: number;
}

export interface WhatIf {
  id: string;
  label: string;
  type: 'toggle' | 'slider';
  currentValue: number | boolean;
  range?: [number, number];
  step?: number;
  unit?: string;
}

export interface Action {
  id: string;
  title: string;
  description: string;
  evidenceLevel: EvidenceLevel;
  category: 'lifestyle' | 'screening' | 'supplement' | 'medical';
}

export interface Finding {
  id: string;
  title: string;
  summary: string;
  rsIds: string[];
  riskLevel: RiskLevel;
  evidenceLevel: EvidenceLevel;
  baseRiskScore: number; // 0-100
  absoluteRisk?: string;
  category: 'trait' | 'disease';
  actions: Action[];
  whatIf: WhatIf[];
  uncertaintyRange?: [number, number];
}

export interface Report {
  id: string;
  vendor: Vendor;
  quality: 'High' | 'Medium' | 'Low';
  generatedAt: Date;
  findings: Finding[];
  demographics?: Demographics;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  findingContext?: {
    findingId: string;
    title: string;
    riskLevel: RiskLevel;
    rsIds: string[];
  };
}

export interface AppState {
  phase: 'upload' | 'processing' | 'report';
  demographics: Demographics;
  uploadedFile?: File;
  report?: Report;
  selectedFindingId?: string;
  chatMessages: ChatMessage[];
  uiPreferences: {
    evidenceExpanded: Record<EvidenceLevel, boolean>;
    chatOpen: boolean;
  };
}