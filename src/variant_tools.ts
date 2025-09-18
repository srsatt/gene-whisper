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

/**
 * Parses a MyHeritage-style text file and converts it to a map of InputVariant objects.
 * @param fileContent The raw text content of the uploaded file.
 * @returns A record mapping a lowercase rsid to its InputVariant object.
 */
export function parseMyHeritageFile(fileContent: string): Record<string, InputVariant> {
  const lines = fileContent.split('\n');
  const variants: Record<string, InputVariant> = {};

  for (const line of lines) {
    // Skip comment lines (usually starting with '#') and empty lines
    if (line.startsWith('#') || line.trim() === '' || line.startsWith('RSID')) {
      continue;
    }

    // MyHeritage format: "rsid","chromosome","position","genotype"
    // 1. Split the line by commas.
    // 2. Map over each part to remove the surrounding double quotes.
    const columns = line.trim().split(',').map(col => col.replace(/"/g, ''));

    // Expect 4 columns: rsid, chromosome, position, genotype
    if (columns.length >= 4) {
      const [rsid, chromosome, position, genotype] = columns;

      // Validate that the rsid looks correct
      if (rsid.startsWith('rs')) {
        const variant: InputVariant = {
          rsid,
          chromosome,
          position: parseInt(position, 10),
          genotype
        };

        // Use lowercase rsid as the key for case-insensitive matching
        variants[rsid.toLowerCase()] = variant;
      }
    }
  }

  return variants;
}

// --- DATABASE LOADING ---
/**
 * Loads and prepares ClinVar database from JSON file, enriching it with cluster descriptions.
 * @param fetchWithProgress Optional progress tracking fetch function
 * @returns A record mapping lowercase rsid to ClinVar variant objects
 */
export async function loadClinvarDatabase(
  fetchWithProgress?: (url: string, phase: string) => Promise<Response>
): Promise<Record<string, DatabaseVariant>> {
  // Use the provided fetch function or the default browser fetch
  const fetcher = fetchWithProgress
    ? fetchWithProgress
    : (url: string) => fetch(url);

  // Use static subdomain for better CDN performance and caching
  // Handle different hosting environments
  const staticBaseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? (() => {
        const hostname = window.location.hostname;
        // For pages.dev domains, use the dedicated worker
        if (hostname.endsWith('.pages.dev')) {
          return 'https://gene-whisper-static-prod.srsatt.workers.dev';
        }
        // For custom domains, use static subdomain
        return `https://static.${hostname}`;
      })()
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

  // Fetch all three required JSON files concurrently for better performance
  const [
    clinvarResponse,
    rsidMapResponse,
    clustersResponse
  ] = await Promise.all([
    fetcher(`${staticBaseUrl}/data/clinvar.json`, 'Loading ClinVar database'),
    fetcher(`${staticBaseUrl}/data/clinvar_description_map.json`, 'Loading ClinVar RSID map'), // Assumed filename
    fetcher(`${staticBaseUrl}/data/clinvar_descriptions.json`, 'Loading ClinVar descriptions') // Assumed filename
  ]);

  const clinvarArray = await clinvarResponse.json();
  const rsidMapArray: { rsid: string; cluster_id: number }[] = await rsidMapResponse.json();
  const clustersArray: { cluster_id: number; generated_description: string }[] = await clustersResponse.json();

  // 1. Create a map from cluster_id to generated_description for quick lookups
  const clusterIdToDescriptionMap = clustersArray.reduce((acc, cluster) => {
    acc[cluster.cluster_id] = cluster.generated_description;
    return acc;
  }, {} as Record<number, string>);

  // 2. Create a map from rsid to cluster_id
  const rsidToClusterIdMap = rsidMapArray.reduce((acc, item) => {
    acc[item.rsid.toLowerCase()] = item.cluster_id;
    return acc;
  }, {} as Record<string, number>);

  // 3. Build the final clinvarMap, enriching it with the descriptions
  const clinvarMap: Record<string, DatabaseVariant> = {};
  for (const variant of clinvarArray) {
    if (variant.rsid && variant.rsid.startsWith('rs')) {
      const lowerRsid = variant.rsid.toLowerCase();

      // Find the cluster ID for the current variant's RSID
      const clusterId = rsidToClusterIdMap[lowerRsid];

      // Use the cluster ID to find the generated description
      const generatedDescription = clusterId !== undefined ? clusterIdToDescriptionMap[clusterId] : variant.phenotype || 'No description available';

      clinvarMap[lowerRsid] = {
        rsid: variant.rsid,
        reference_allele: variant.reference_allele,
        alternative_allele: variant.alternative_allele,
        evidence_level: variant.evidence_level,
        gene_name: variant.gene_name,
        phenotype: variant.phenotype,
        chrom: variant.chrom,
        position: variant.position,
        // Add the new description field
        description: generatedDescription,
      };
    }
  }

  return clinvarMap;
}

/**
 * Loads and prepares SNP data from structured JSON file.
 * @param fetchWithProgress Optional progress tracking fetch function
 * @returns A record mapping lowercase rsid to SNP data variant objects
 */
export async function loadSnpDatabase(
  fetchWithProgress?: (url: string, phase: string) => Promise<Response>
): Promise<Record<string, DatabaseVariant>> {
  // Use static subdomain for better CDN performance and caching
  // Handle different hosting environments
  const staticBaseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? (() => {
        const hostname = window.location.hostname;
        // For pages.dev domains, use the dedicated worker
        if (hostname.endsWith('.pages.dev')) {
          return 'https://gene-whisper-static-prod.srsatt.workers.dev';
        }
        // For custom domains, use static subdomain
        return `https://static.${hostname}`;
      })()
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
    
  const response = fetchWithProgress
    ? await fetchWithProgress(`${staticBaseUrl}/data/snp-data-structured.json`, 'Loading structured SNP data')
    : await fetch(`${staticBaseUrl}/data/snp-data-structured.json`);

  const structuredData = await response.json();
  const snpDataMap: Record<string, DatabaseVariant> = {};

  // Process each SNP in the structured data
  for (const [snpKey, snpData] of Object.entries(structuredData.snps as Record<string, any>)) {
    let rsid = "";
    let gene_name = "";
    let description = "";
    let pmids: string[] = [];
    let reference_allele = "";
    let alternative_allele = "";
    let chromosome = "";
    let position: number | undefined;
    let gmaf = "";
    let orientation = "";
    let stabilized = "";

    // Extract basic SNP information from sections and templates
    if (snpData.sections && Array.isArray(snpData.sections)) {
      for (const section of snpData.sections) {
        // Extract description from paragraphs
        if (section.paragraphs && Array.isArray(section.paragraphs)) {
          for (const paragraph of section.paragraphs) {
            if (paragraph.sentences && Array.isArray(paragraph.sentences)) {
              for (const sentence of paragraph.sentences) {
                if (sentence.text && description.length < 500) {
                  description += (description ? " " : "") + sentence.text;
                }
              }
            }
          }
        }

        // Extract metadata from templates
        if (section.templates && Array.isArray(section.templates)) {
          for (const template of section.templates) {
            // Get rsid from rsnum template
            if (template.template === 'rsnum' && template.rsid) {
              rsid = `rs${template.rsid}`;
              chromosome = template.chromosome || "";
              position = template.position ? parseInt(template.position) : undefined;
              gmaf = template.gmaf || "";
              orientation = template.orientation || "";
              stabilized = template.stabilizedorientation || "";

              // Extract reference and alternative alleles from geno1, geno2, geno3
              if (template.geno1 && template.geno2) {
                const geno1Match = template.geno1.match(/\(([ACGT]);([ACGT])\)/);
                const geno2Match = template.geno2.match(/\(([ACGT]);([ACGT])\)/);

                if (geno1Match && geno2Match) {
                  // geno1 should be homozygous reference
                  const ref1 = geno1Match[1];
                  const ref2 = geno1Match[2];

                  if (ref1 === ref2) {
                    reference_allele = ref1;
                    // Find the alternative allele from geno2 (heterozygous)
                    const het1 = geno2Match[1];
                    const het2 = geno2Match[2];
                    alternative_allele = (het1 === ref1) ? het2 : het1;
                  }
                }
              }
            }

            // Get gene name from GWAS summary or other templates
            if (template.gene && !gene_name) {
              gene_name = template.gene;
            }

            // Collect PMIDs
            if (template.pmid) {
              pmids.push(template.pmid);
            }
            if (template.pubmedid) {
              pmids.push(template.pubmedid);
            }
            if (template.list && template.template === 'pmid') {
              pmids.push(...template.list);
            }
          }
        }
      }
    }

    // Process genotypes to create StructuredGenotype objects
    const genotypes: StructuredGenotype[] = [];
    if (snpData.genotypes && Array.isArray(snpData.genotypes)) {
      for (const genotype of snpData.genotypes) {
        if (genotype.sections && Array.isArray(genotype.sections)) {
          for (const section of genotype.sections) {
            if (section.templates && Array.isArray(section.templates)) {
              for (const template of section.templates) {
                if (template.template === 'genotype' && template.allele1 && template.allele2) {
                  genotypes.push({
                    name: genotype.name,
                    allele1: template.allele1,
                    allele2: template.allele2,
                    magnitude: template.magnitude || "0",
                    repute: template.repute || "Unknown",
                    summary: template.summary || "",
                    tags: genotype.tags,
                    sections: genotype.sections
                  });
                }
              }
            }
          }
        }
      }
    }

    // Handle both template-based rsid extraction and direct key-based rsid
    let finalRsid = rsid;
    if (!finalRsid && snpKey.startsWith('Rs')) {
      // Use the key as rsid (convert Rs12345 -> rs12345)
      finalRsid = snpKey.charAt(0).toLowerCase() + snpKey.slice(1);
    }

    // Only add SNPs that have rsid
    if (finalRsid && finalRsid.startsWith('rs')) {
      const rsidLower = finalRsid.toLowerCase();

      snpDataMap[rsidLower] = {
        rsid: finalRsid,
        reference_allele: reference_allele,
        alternative_allele: alternative_allele,
        gene_name: gene_name || null,
        chromosome: chromosome,
        position: position,
        gmaf: gmaf,
        orientation: orientation,
        stabilized: stabilized,
        pmids: pmids.join(','),
        diseases: "",
        description: description.trim(),
        tags: snpData.tags,
        genotypes: genotypes
      };
    }
  }

  return snpDataMap;
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

  // Enhanced SNPedia structured data fields
  chromosome?: string;
  gmaf?: string;
  orientation?: string;
  stabilized?: string;
  magnitude?: string;
  repute?: string;
  summary?: string;
  tags?: {
    medicines: string[];
    topics: string[];
    conditions: string[];
  };
  genotypes?: StructuredGenotype[];

  // Allow other properties for flexibility
  [key: string]: any;
}

/** Represents a genotype from the structured SNP data */
export interface StructuredGenotype {
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
}

/** Represents a final, matched variant found in the user's genome. */
export interface ResultVariant extends DatabaseVariant {
  /** The user's genotype code.
   * 1: Heterozygous (one copy of the alternative allele)
   * 2: Homozygous (two copies of the alternative allele)
   */
  genotype: 1 | 2;
  /** The user's actual alleles from their genome file (e.g., "AG", "GG") */
  user_allele: string;
  /** The source database (clinvar or snpedia). */
  source: 'clinvar' | 'snpedia';
  /** The matched genotype data for SNPedia variants */
  matched_genotype?: StructuredGenotype;
  /** Enhanced SNP data for rendering (only available for snpedia source) */
  snpData?: import('./snp-data-raw').SnpData;
}

// --- CORE LOGIC ---

/**
 * Handles orientation and stabilization for SNPedia data.
 * When orientation or stabilization is "minus", alleles need to be flipped.
 */
function handleOrientation(alleles: string, orientation?: string, stabilized?: string): string {
  // If either orientation or stabilization is "minus", flip the alleles
  const needsFlip = orientation === 'minus' || stabilized === 'minus';

  if (!needsFlip) {
    return alleles;
  }

  // Complement mapping for DNA bases
  const complement: Record<string, string> = {
    'A': 'T',
    'T': 'A',
    'C': 'G',
    'G': 'C',
    'I': 'I', // Insertion stays the same
    'D': 'D', // Deletion stays the same
    '-': '-'  // No call stays the same
  };

  return alleles.split('').map(allele => complement[allele] || allele).join('');
}

/**
 * Determines the genotype code based on the user's alleles.
 */
function getGenotypeCode(actual: string, refAllele: string, altAllele: string, orientation?: string, stabilized?: string): number {
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

  // Handle orientation and stabilization
  const alleles = handleOrientation(actual, orientation, stabilized);

  // Homozygous if single allele provided (e.g., from X or Y chromosome)
  let normalizedAlleles = alleles;
  if (normalizedAlleles.length === 1) {
    normalizedAlleles = normalizedAlleles + normalizedAlleles;
  }

  if (normalizedAlleles.length !== 2) {
    return -1; // Unknown genotype
  }

  const allele1 = normalizedAlleles[0];
  const allele2 = normalizedAlleles[1];

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
 * Finds the matching genotype from structured data based on user's alleles.
 */
function findMatchingGenotype(
  userAlleles: string,
  genotypes: StructuredGenotype[],
  orientation?: string,
  stabilized?: string
): StructuredGenotype | null {
  // Apply orientation flipping for genotype matching
  // When orientation/stabilization is minus, we need to flip the user's alleles
  const processedAlleles = handleOrientation(userAlleles, orientation, stabilized);

  // Normalize to 2 characters if single character (X/Y chromosome)
  let normalizedAlleles = processedAlleles;
  if (normalizedAlleles.length === 1) {
    normalizedAlleles = normalizedAlleles + normalizedAlleles;
  }

  if (normalizedAlleles.length !== 2) {
    return null;
  }

  const [allele1, allele2] = normalizedAlleles.split('');

  // Find matching genotype - order doesn't matter
  for (const genotype of genotypes) {
    const genoAllele1 = genotype.allele1;
    const genoAllele2 = genotype.allele2;

    if ((allele1 === genoAllele1 && allele2 === genoAllele2) ||
        (allele1 === genoAllele2 && allele2 === genoAllele1)) {
      return genotype;
    }
  }
  return null;
}

/**
 * Checks a single user variant against a database variant.
 */
function getMatchingVariant(
  inputVariant: InputVariant,
  dbVariant: DatabaseVariant,
  source: 'clinvar' | 'snpedia'
): ResultVariant | null {
  const genotypeCode = getGenotypeCode(
    inputVariant.genotype,
    dbVariant.reference_allele,
    dbVariant.alternative_allele,
    dbVariant.orientation,
    dbVariant.stabilized
  );

  // For SNPedia variants, also try to find the matching genotype
  let matchedGenotype: StructuredGenotype | undefined;
  if (source === 'snpedia' && dbVariant.genotypes) {
    matchedGenotype = findMatchingGenotype(
      inputVariant.genotype,
      dbVariant.genotypes,
      dbVariant.orientation,
      dbVariant.stabilized
    ) || undefined;
  }

  // For ClinVar: only care about variants where the user has the alternative allele
  // For SNPedia: include any genotype match with meaningful data
  const hasVariantAllele = genotypeCode > 0;
  const hasMatchedGenotype = matchedGenotype !== undefined;
  const hasSignificantGenotype = matchedGenotype && parseFloat(matchedGenotype.magnitude) > 0;


  let shouldInclude = false;
  if (source === 'clinvar') {
    // ClinVar: only include if user has alternative allele
    shouldInclude = hasVariantAllele;
  } else if (source === 'snpedia') {
    // SNPedia: include if we have a matching genotype OR if user has alternative allele
    shouldInclude = hasMatchedGenotype || hasVariantAllele;
  }

  if (shouldInclude) {
    // Create a new object with the database info, user's genotype, and source
    const result: ResultVariant = {
      ...dbVariant,
      genotype: Math.max(genotypeCode, 1) as 1 | 2, // Ensure at least 1 for matched genotypes
      user_allele: inputVariant.genotype,
      source: source,
      matched_genotype: matchedGenotype,
    };
    return result;
  }

  return null;
}

// --- MAIN EXPORTED FUNCTION ---

/**
 * Finds the intersection between a user's 23andMe variants and ClinVar/SNPedia databases.
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
 * Infers evidence level from magnitude for SNPedia variants.
 */
function inferEvidenceLevel(magnitude: string): string {
  const mag = parseFloat(magnitude);

  if (mag >= 5) return "4+ Stars"; // Very high significance
  if (mag >= 3) return "3 Stars";  // High significance
  if (mag >= 2) return "2 Stars";  // Moderate significance
  if (mag >= 1) return "1 Star";   // Low significance
  return "0 Stars";                // No significance
}

/**
 * Converts ResultVariant[] to Mutation[] for report generation.
 */
export function convertToMutations(resultVariants: ResultVariant[]): any[] {
  return resultVariants
    .filter(variant => {
      // For SNPedia variants, require either a matched genotype or basic condition info
      if (variant.source === 'snpedia') {
        const hasMatchedGenotype = variant.matched_genotype &&
          parseFloat(variant.matched_genotype.magnitude) > 0;
        const hasBasicInfo = variant.diseases || variant.description;
        return hasMatchedGenotype || hasBasicInfo;
      }

      // For ClinVar variants, require phenotype and gene
      if (variant.source === 'clinvar') {
        const hasCondition = variant.phenotype;
        const hasGene = variant.gene_name && variant.gene_name.trim() !== '';
        return hasCondition && hasGene;
      }

      return false; // Unknown source
    })
    .map(variant => {
      // Determine evidence level
      let evidence_level = '1 Star';
      if (variant.source === 'clinvar') {
        evidence_level = variant.evidence_level || '1 Star';
      } else if (variant.matched_genotype) {
        evidence_level = inferEvidenceLevel(variant.matched_genotype.magnitude);
      }

      // Determine phenotype/summary
      let phenotype = 'Genetic variant';
      let summary = '';
      let repute = '';
      let magnitude = '';

      if (variant.source === 'clinvar') {
        phenotype = variant.phenotype || 'Genetic variant';
      } else if (variant.matched_genotype) {
        phenotype = variant.matched_genotype.summary || variant.description || 'Genetic variant';
        summary = variant.matched_genotype.summary;
        repute = variant.matched_genotype.repute;
        magnitude = variant.matched_genotype.magnitude;
      } else {
        phenotype = variant.diseases || variant.description || 'Genetic variant';
      }

      return {
        rsid: variant.rsid,
        evidence_level: evidence_level,
        gene_name: variant.gene_name,
        phenotype: phenotype,
        summary: summary,
        repute: repute,
        magnitude: magnitude,
        chrom: (variant.chrom || variant.chromosome)?.toString() || 'Unknown',
        position: variant.position || 0,
        reference_allele: variant.reference_allele,
        alternative_allele: variant.alternative_allele,
        genotype: variant.genotype,
        user_allele: variant.user_allele,
        gmaf: variant.gmaf,
        orientation: variant.orientation,
        stabilized: variant.stabilized,
        raw: JSON.stringify(variant),
        source: variant.source,
        matched_genotype: variant.matched_genotype,
        tags: variant.tags,
        snpData: variant.snpData,
        description: variant.description
      };
    });
}
