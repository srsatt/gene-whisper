// src/services/variantIntersection.ts

// --- TYPE DEFINITIONS ---
// These interfaces define the shape of your data for type safety.

/** Represents a single variant from the user's 23andMe file. */
export interface InputVariant {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
}

// --- FILE PARSING ---

/**
 * Parses a 23andMe-style text file and converts it to InputVariant objects.
 * @param fileContent The raw text content of the uploaded file
 * @returns A record mapping rsid to InputVariant objects
 */
export function parseGenomeFile(fileContent: string): Record<string, InputVariant> {
  const lines = fileContent.split('\n');
  const variants: Record<string, InputVariant> = {};

  for (const line of lines) {
    // Skip comment lines and empty lines
    if (line.startsWith('#') || line.trim() === '') {
      continue;
    }

    // Split by tabs or whitespace
    const columns = line.trim().split(/\s+/);

    // Expect 4 columns: rsid, chromosome, position, genotype
    if (columns.length >= 4) {
      const [rsid, chromosome, position, genotype] = columns;

      // Validate rsid format
      if (rsid.startsWith('rs')) {
        const variant: InputVariant = {
          rsid,
          chromosome,
          position: parseInt(position, 10),
          genotype
        };

        // Use lowercase rsid as key for matching
        variants[rsid.toLowerCase()] = variant;
      }
    }
  }

  return variants;
}

// --- DATABASE LOADING ---

/**
 * Loads and prepares ClinVar database from JSON file.
 * @param fetchWithProgress Optional progress tracking fetch function
 * @returns A record mapping lowercase rsid to ClinVar variant objects
 */
export async function loadClinvarDatabase(
  fetchWithProgress?: (url: string, phase: string) => Promise<Response>
): Promise<Record<string, DatabaseVariant>> {
  const response = fetchWithProgress 
    ? await fetchWithProgress('/data_files/clinvar.json', 'Loading ClinVar database')
    : await fetch('/data_files/clinvar.json');
  
  const clinvarArray = await response.json();

  const clinvarMap: Record<string, DatabaseVariant> = {};

  for (const variant of clinvarArray) {
    if (variant.rsid && variant.rsid.startsWith('rs')) {
      clinvarMap[variant.rsid.toLowerCase()] = {
        rsid: variant.rsid,
        reference_allele: variant.reference_allele,
        alternative_allele: variant.alternative_allele,
        evidence_level: variant.evidence_level,
        gene_name: variant.gene_name,
        phenotype: variant.phenotype,
        chrom: variant.chrom,
        position: variant.position
      };
    }
  }

  return clinvarMap;
}

/**
 * Loads and prepares SNPedia database from JSON file.
 * @param fetchWithProgress Optional progress tracking fetch function
 * @returns A record mapping lowercase rsid to SNPedia variant objects
 */
export async function loadSnpediaDatabase(
  fetchWithProgress?: (url: string, phase: string) => Promise<Response>
): Promise<Record<string, DatabaseVariant>> {
  const response = fetchWithProgress
    ? await fetchWithProgress('/data_files/snpedia.json', 'Loading SNPedia database')
    : await fetch('/data_files/snpedia.json');
  
  const snpediaArray = await response.json();

  const snpediaMap: Record<string, DatabaseVariant> = {};

  for (const variant of snpediaArray) {
    if (variant.rsid && variant.rsid.startsWith('rs')) {
      snpediaMap[variant.rsid.toLowerCase()] = {
        rsid: variant.rsid,
        reference_allele: variant.reference_allele,
        alternative_allele: variant.alternative_allele,
        gene_name: variant.gene_name,
        pmids: variant.pmids,
        diseases: variant.diseases,
        description: variant.description
      };
    }
  }

  return snpediaMap;
}

/** Represents a variant from the ClinVar or SNPedia database. */
export interface DatabaseVariant {
  rsid: string;
  reference_allele: string;
  alternative_allele: string;
  gene_name?: string | null;

  // ClinVar specific fields
  evidence_level?: string;
  phenotype?: string;
  chrom?: string;
  position?: number;

  // SNPedia specific fields
  pmids?: string;
  diseases?: string;
  description?: string;

  // Allow other properties for flexibility
  [key: string]: any;
}

/** Represents a final, matched variant found in the user's genome. */
export interface ResultVariant extends DatabaseVariant {
  /** * The user's genotype code.
   * 1: Heterozygous (one copy of the alternative allele)
   * 2: Homozygous (two copies of the alternative allele)
   */
  genotype: 1 | 2;
  /** The source database (clinvar or snpedia). */
  source: 'clinvar' | 'snpedia';
}

// --- CORE LOGIC ---

/**
 * Determines the genotype code based on the user's alleles.
 * @param actual The user's genotype string from the 23andMe file (e.g., "AA", "AG").
 * @param refAllele The reference allele from the database (e.g., "A").
 * @param altAllele The alternative allele from the database (e.g., "G").
 * @returns 0 for homozygous reference, 1 for heterozygous, 2 for homozygous alternative, -1 for invalid/unknown.
 */
function getGenotypeCode(actual: string, refAllele: string, altAllele: string): number {
  // We do not work with homozygous insertions or deletions, they are unreliable!
  if (actual === 'II' || actual === 'DD') {
    return -1;
  }
  // Heterozygous indel is considered a variant
  if (actual === 'ID' || actual === 'DI') {
    return 1;
  }
  // No Call
  if (actual === '--') {
    return -1;
  }

  let alleles = actual;
  // Homozygous if single allele provided (e.g., from X or Y chromosome)
  if (alleles.length === 1) {
    alleles = alleles + alleles;
  }

  if (alleles.length !== 2) {
    return -1; // Unknown genotype
  }

  const allele1 = alleles[0];
  const allele2 = alleles[1];

  // Homozygous Reference (e.g., ref is 'A', actual is 'AA')
  if (allele1 === refAllele && allele2 === refAllele) {
    return 0;
  }

  // Homozygous Alternative (e.g., alt is 'G', actual is 'GG')
  if (allele1 === altAllele && allele2 === altAllele) {
    return 2;
  }

  // Heterozygous (e.g., ref 'A', alt 'G', actual is 'AG' or 'GA')
  if ((allele1 === refAllele && allele2 === altAllele) || (allele1 === altAllele && allele2 === refAllele)) {
    return 1;
  }

  return -1; // Unknown or does not match
}

/**
 * Checks a single user variant against a database variant.
 * @returns A ResultVariant object if the user has at least one alternative allele, otherwise null.
 */
function getMatchingVariant(
  inputVariant: InputVariant,
  dbVariant: DatabaseVariant,
  source: 'clinvar' | 'snpedia'
): ResultVariant | null {
  const genotypeCode = getGenotypeCode(
    inputVariant.genotype,
    dbVariant.reference_allele,
    dbVariant.alternative_allele
  );

  // We only care about variants where the user has the alternative allele (heterozygous or homozygous)
  if (genotypeCode > 0) {
    // Create a new object with the database info, user's genotype, and source
    const result: ResultVariant = {
      ...dbVariant, // Shallow copy is fine as the data structure is flat
      genotype: genotypeCode as 1 | 2,
      source: source,
    };
    return result;
  }

  return null;
}


// --- MAIN EXPORTED FUNCTION ---

/**
 * Finds the intersection between a user's 23andMe variants and ClinVar/SNPedia databases.
 * @param inputMap A map of lowercase rsIDs to the user's variant data.
 * @param clinvarMap A map of lowercase rsIDs to ClinVar variant data.
 * @param snpediaMap A map of lowercase rsIDs to SNPedia variant data.
 * @returns An array of variants present in the user's genome with at least one alternative allele.
 */
export function findSharedVariants(
  inputMap: Record<string, InputVariant>,
  clinvarMap: Record<string, DatabaseVariant>,
  snpediaMap: Record<string, DatabaseVariant>
): ResultVariant[] {
  const results: ResultVariant[] = [];

  for (const rsid in inputMap) {
    const inputVariant = inputMap[rsid];

    // Check against ClinVar
    const clinvarVariant = clinvarMap[rsid];
    if (clinvarVariant) {
      const match = getMatchingVariant(inputVariant, clinvarVariant, 'clinvar');
      if (match) {
        results.push(match);
      }
    }

    // Check against SNPedia
    const snpediaVariant = snpediaMap[rsid];
    if (snpediaVariant) {
      const match = getMatchingVariant(inputVariant, snpediaVariant, 'snpedia');
      if (match) {
        results.push(match);
      }
    }
  }

  // Sort results: ClinVar first, then SNPedia
  // Within each source, sort by condition availability, then by rsid
  results.sort((a, b) => {
    // First sort by source: clinvar comes before snpedia
    if (a.source !== b.source) {
      return a.source === 'clinvar' ? -1 : 1;
    }

    // Within same source, prioritize variants with conditions
    const aHasCondition = (a.source === 'clinvar' && a.phenotype && a.phenotype.trim() !== '') ||
                         (a.source === 'snpedia' && a.diseases && a.diseases.trim() !== '');
    const bHasCondition = (b.source === 'clinvar' && b.phenotype && b.phenotype.trim() !== '') ||
                         (b.source === 'snpedia' && b.diseases && b.diseases.trim() !== '');
    
    if (aHasCondition !== bHasCondition) {
      return aHasCondition ? -1 : 1; // Variants with conditions come first
    }

    // Within same condition availability, sort by rsid
    return a.rsid.localeCompare(b.rsid);
  });

  return results;
}

// --- REPORT GENERATION ---

/**
 * Converts ResultVariant[] to Mutation[] for report generation.
 * Handles both ClinVar and SNPedia variants with different field structures.
 * @param resultVariants Array of shared variants from findSharedVariants
 * @returns Array of mutations formatted for the report
 */
export function convertToMutations(resultVariants: ResultVariant[]): any[] {
  return resultVariants
    .filter(variant => {
      // Include variants that have either phenotype (ClinVar) or diseases (SNPedia)
      const hasCondition = (variant.source === 'clinvar' && variant.phenotype) || 
                          (variant.source === 'snpedia' && variant.diseases);
      const hasGene = variant.gene_name && variant.gene_name.trim() !== '';
      return hasCondition && hasGene;
    })
    .map(variant => ({
      rsid: variant.rsid,
      evidence_level: variant.evidence_level || '1 Star', // ClinVar has this, SNPedia defaults to 1 Star
      gene_name: variant.gene_name,
      // Use phenotype for ClinVar, diseases for SNPedia
      phenotype: variant.source === 'clinvar' ? variant.phenotype : variant.diseases,
      chrom: variant.chrom?.toString() || 'Unknown',
      position: variant.position || 0,
      reference_allele: variant.reference_allele,
      alternative_allele: variant.alternative_allele
    }));
}
