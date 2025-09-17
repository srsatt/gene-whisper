import {env} from '@xenova/transformers'
import type { MLCEngineInterface } from '@mlc-ai/web-llm'

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
  snpData?: import('./snp-data-raw').SnpData; // Enhanced data for rendering
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

export interface Report {
  id: string;
  vendor: Vendor;
  generatedAt: Date;
  mutations: Mutation[];
  demographics?: Demographics;
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
