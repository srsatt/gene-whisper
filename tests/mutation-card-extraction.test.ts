import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mutation Card Data Extraction', () => {
  let structuredData: any;
  let processedSnpDatabase: Record<string, any>;

  beforeAll(async () => {
    // Load the structured data directly from file
    const dataPath = path.join(process.cwd(), 'public', 'snp-data-structured.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    structuredData = JSON.parse(rawData);

    // Process it manually like loadSnpDatabase would
    processedSnpDatabase = {};

    for (const [snpKey, snpData] of Object.entries(structuredData.snps as Record<string, any>)) {
      let finalRsid = '';

      // Extract rsid from templates first
      if (snpData.sections && Array.isArray(snpData.sections)) {
        for (const section of snpData.sections) {
          if (section.templates && Array.isArray(section.templates)) {
            for (const template of section.templates) {
              if (template.template === 'rsnum' && template.rsid) {
                finalRsid = `rs${template.rsid}`;
                break;
              }
            }
          }
          if (finalRsid) break;
        }
      }

      // Fallback to key-based rsid
      if (!finalRsid && snpKey.startsWith('Rs')) {
        finalRsid = snpKey.charAt(0).toLowerCase() + snpKey.slice(1);
      }

      if (finalRsid && finalRsid.startsWith('rs')) {
        const rsidLower = finalRsid.toLowerCase();

        // Extract description
        let description = "";
        if (snpData.sections && Array.isArray(snpData.sections)) {
          for (const section of snpData.sections) {
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
          }
        }

        // Process genotypes
        const genotypes: any[] = [];
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

        processedSnpDatabase[rsidLower] = {
          rsid: finalRsid,
          description: description.trim(),
          tags: snpData.tags,
          genotypes: genotypes
        };
      }
    }
  });

  it('should load SNP database with Rs SNPs converted to rs format', async () => {
    expect(Object.keys(processedSnpDatabase).length).toBeGreaterThan(1000);

    // Check that we have rs SNPs (converted from Rs format)
    const rsSnps = Object.keys(processedSnpDatabase).filter(key => key.startsWith('rs'));
    expect(rsSnps.length).toBeGreaterThan(1000);

    console.log(`Loaded ${Object.keys(processedSnpDatabase).length} total SNPs`);
    console.log(`Found ${rsSnps.length} rs SNPs`);
  });

  it('should have SNPs with tag data', async () => {
    const snpsWithTags = Object.values(processedSnpDatabase).filter((snp: any) => {
      if (!snp.tags) return false;
      const totalTags = (snp.tags.medicines?.length || 0) +
                       (snp.tags.topics?.length || 0) +
                       (snp.tags.conditions?.length || 0);
      return totalTags > 0;
    });

    expect(snpsWithTags.length).toBeGreaterThan(0);
    console.log(`Found ${snpsWithTags.length} SNPs with tag data`);

    if (snpsWithTags.length > 0) {
      const sampleSnp = snpsWithTags[0] as any;
      console.log(`Sample SNP with tags: ${sampleSnp.rsid}`);
      console.log('Sample tags:', {
        medicines: sampleSnp.tags.medicines?.slice(0, 3),
        topics: sampleSnp.tags.topics?.slice(0, 3),
        conditions: sampleSnp.tags.conditions?.slice(0, 3)
      });
    }
  });

  it('should have SNPs with descriptions', async () => {
    const snpsWithDescriptions = Object.values(processedSnpDatabase).filter((snp: any) =>
      snp.description && snp.description.trim().length > 20
    );

    expect(snpsWithDescriptions.length).toBeGreaterThan(0);
    console.log(`Found ${snpsWithDescriptions.length} SNPs with descriptions`);

    if (snpsWithDescriptions.length > 0) {
      const sampleSnp = snpsWithDescriptions[0] as any;
      console.log(`Sample SNP with description: ${sampleSnp.rsid}`);
      console.log(`Sample description: ${sampleSnp.description.substring(0, 200)}...`);
    }
  });

  it('should have SNPs with structured genotype data', async () => {
    const snpsWithGenotypes = Object.values(processedSnpDatabase).filter((snp: any) =>
      snp.genotypes && snp.genotypes.length > 0
    );

    expect(snpsWithGenotypes.length).toBeGreaterThan(0);
    console.log(`Found ${snpsWithGenotypes.length} SNPs with genotype data`);

    if (snpsWithGenotypes.length > 0) {
      const sampleSnp = snpsWithGenotypes[0] as any;
      console.log(`Sample SNP with genotypes: ${sampleSnp.rsid}`);
      console.log(`Genotypes: ${sampleSnp.genotypes.length}`);

      const firstGenotype = sampleSnp.genotypes[0];
      console.log('First genotype:', {
        name: firstGenotype.name,
        alleles: `${firstGenotype.allele1};${firstGenotype.allele2}`,
        magnitude: firstGenotype.magnitude,
        repute: firstGenotype.repute,
        summary: firstGenotype.summary?.substring(0, 100),
        hasTags: !!firstGenotype.tags
      });
    }
  });

  it('should create a realistic mutation object for testing UI', async () => {
    // Find an SNP with rich data for testing
    const richSnp = Object.values(processedSnpDatabase).find((snp: any) => {
      const hasTags = snp.tags && (
        (snp.tags.medicines?.length || 0) +
        (snp.tags.topics?.length || 0) +
        (snp.tags.conditions?.length || 0)
      ) > 2;
      const hasDescription = snp.description && snp.description.length > 50;
      const hasGenotypes = snp.genotypes && snp.genotypes.length > 0;

      return hasTags && hasDescription && hasGenotypes;
    }) as any;

    expect(richSnp).toBeDefined();

    if (richSnp) {
      console.log(`Found rich SNP for UI testing: ${richSnp.rsid}`);

      // Create a mock mutation object like the app would create
      const mockMutation = {
        rsid: richSnp.rsid,
        evidence_level: '3 Stars' as const,
        gene_name: richSnp.gene_name || 'UNKNOWN',
        phenotype: richSnp.genotypes[0]?.summary || 'Genetic variant',
        chrom: richSnp.chromosome || '1',
        position: richSnp.position || 123456,
        reference_allele: richSnp.reference_allele,
        alternative_allele: richSnp.alternative_allele,
        genotype: 1 as const,
        user_allele: 'AG',
        raw: JSON.stringify(richSnp),
        source: 'snpedia' as const,
        tags: richSnp.tags,
        matched_genotype: richSnp.genotypes[0] ? {
          name: richSnp.genotypes[0].name,
          allele1: richSnp.genotypes[0].allele1,
          allele2: richSnp.genotypes[0].allele2,
          magnitude: richSnp.genotypes[0].magnitude,
          repute: richSnp.genotypes[0].repute,
          summary: richSnp.genotypes[0].summary,
          tags: richSnp.genotypes[0].tags
        } : undefined,
        snpData: undefined // This would be the legacy format
      };

      console.log('Mock mutation for UI testing:', {
        rsid: mockMutation.rsid,
        hasTags: !!mockMutation.tags,
        hasMatchedGenotype: !!mockMutation.matched_genotype,
        tagCounts: mockMutation.tags ? {
          medicines: mockMutation.tags.medicines?.length || 0,
          topics: mockMutation.tags.topics?.length || 0,
          conditions: mockMutation.tags.conditions?.length || 0
        } : null
      });

      // This mock mutation should now display tags and descriptions in the UI
      expect(mockMutation.tags).toBeDefined();
      expect(mockMutation.matched_genotype).toBeDefined();
    }
  });
});
