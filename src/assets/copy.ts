// src/assets/copy.ts

export const DISCLAIMER_TOP = "This is not medical advice. Always consult your physician.";

export const UPLOAD_HELPER = "Supported file: 23andMe";

export const START_HELPER = "Processing takes about ~1 minute.";

export const PROCESSING_SUB = "~1 minute expected. You can keep this tab open.";

export const ERR_UNSUPPORTED = "Unsupported file format. Please upload a .txt or .vcf file from a supported vendor.";

export const PARTIAL_PARSE = "Some variants couldn't be processed, but we have enough data for analysis.";

export const CHAT_HEADER = "Ask about your results";

export const CHAT_BADGE = "Not medical advice";

export const PROMPTS = [
  "Explain what contributes to this risk for me.",
  "Which actions have the strongest evidence?",
  "How does this compare to the general population?",
  "Show sources and study quality."
];

export const EVIDENCE_MAP = {
  A: "Scientifically Supported",
  B: "Moderate", 
  C: "Tentative"
};

export const LOADER_LINES = [
  "Parsing and validating file…",
  "Normalizing variant formats…",
  "Computing polygenic risk scores (PRS)…",
  "Screening for monogenic variants…",
  "Cross-referencing ClinVar and GWAS sources…",
  "Estimating absolute vs relative risk…",
  "Adjusting for population background…",
  "Running quality checks…",
  "Preparing personalized insights…"
];
