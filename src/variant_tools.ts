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

/** Represents a variant from the ClinVar or SNPedia database. */
export interface DatabaseVariant {
  rsid: string;
  reference_allele: string;
  alternative_allele: string;
  // Add other properties common to both or specific to each
  [key: string]: any; // Allows for other properties
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

  return results;
}