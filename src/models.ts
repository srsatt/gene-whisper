import {env} from '@xenova/transformers'
import type { MLCEngineInterface } from '@mlc-ai/web-llm'
import type { SnpData } from './snp-data-raw';

export type Vendor = '23andMe' | 'MyHeritage' | 'Ancestry' | 'Generic VCF';

export type StarRating = '1 Star' | '3 Stars' | '4 Stars';

export interface Mutation {
  rsid: string;
  evidence_level: StarRating;
  gene_name: string;
  phenotype: string;
  chrom: string;
  position: number;
  reference_allele: string;
  alternative_allele: string;
  genotype: 1|2;
  raw: string;
  source?: string;
  snpData?: SnpData;
  
  // Enhanced fields from structured data
  user_allele?: string;
  summary?: string;
  repute?: string;
  magnitude?: string;
  gmaf?: string;
  orientation?: string;
  stabilized?: string;
  matched_genotype?: {
    name: string;
    allele1: string;
    allele2: string;
    magnitude: string;
    repute: string;
    summary: string;
    tags?: {
      medicines: string[];
      topics: string[];
      conditions: string[];
    };
    sections?: any[];
  };
  tags?: {
    medicines: string[];
    topics: string[];
    conditions: string[];
  };
}

export type SexAtBirth = 'Male' | 'Female' | 'Intersex' | 'Prefer not to say';
export type ChatModel = {
  engine: MLCEngineInterface
  modelId: string;
  backend: 'webgpu'
}

// Optional: read HF token from localStorage for gated models
const hfToken = typeof localStorage !== 'undefined' ? localStorage.getItem('hf_token') ?? undefined : undefined
if (hfToken) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (env as any).HF_TOKEN = hfToken
}

export interface Demographics {
  sexAtBirth?: SexAtBirth;
  age?: number;
  weight?: number;
}

export type DiabetesType = 'Type 1' | 'Type 2' | 'None';
export type StressLevel = 'never' | 'occasionally' | 'often' | 'always';
export type CheckupFrequency = '<1 year' | '1–3 years' | '>3 years' | 'never';

export interface ExtendedDemographics {
  // Basic Demographics (from existing Demographics)
  height?: number; // cm
  
  // Lifestyle & Habits
  exerciseDaysPerWeek?: number; // 0-7
  sleepHoursPerNight?: number; // hours
  smoker?: boolean;
  alcoholDrinksPerWeek?: number;
  fruitVegServingsPerDay?: number; // 0-10+
  
  // Medical History
  hasHighBloodPressure?: boolean;
  diabetesType?: DiabetesType;
  hasHeartDiseaseOrStroke?: boolean;
  hasCancer?: boolean;
  
  // Mental & Social Health
  stressLevel?: StressLevel;
  hasSocialSupport?: boolean;
  hasConcentrationProblems?: boolean;
  
  // Family History & Genetics
  familyHistoryCardiovascular?: boolean;
  familyHistoryCancer?: boolean;
  
  // Recent Symptoms & Screening
  hasUnintentionalWeightLoss?: boolean;
  hasShortnesOfBreath?: boolean;
  lastCheckup?: CheckupFrequency;
}

export interface Report {
  id: string;
  vendor: Vendor;
  generatedAt: Date;
  mutations: Mutation[];
  demographics?: Demographics;
  extendedDemographics?: ExtendedDemographics;
  prsResults?: import('./prs').PRSResult[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mutationContext?: {
    rsid: string;
    gene_name: string;
    phenotype: string;
  };
}

export interface SelectedItem {
  type: 'mutation' | 'prs';
  id: string;
}

export interface AppState {
  phase: 'upload' | 'processing' | 'report';
  demographics: Demographics;
  extendedDemographics: ExtendedDemographics;
  uploadedFile?: File;
  report?: Report;
  selectedMutationId?: string;
  selectedItem?: SelectedItem;
  chatMessages: ChatMessage[];
  progressInfo?: import('./utils/progressTracker').ProgressInfo;
  uiPreferences: {
    sectionsExpanded: Record<StarRating | 'PRS', boolean>;
    chatOpen: boolean;
  };
}
