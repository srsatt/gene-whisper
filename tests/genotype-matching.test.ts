import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  loadSnpDatabase, 
  parseGenomeFile, 
  findSharedVariants, 
  convertToMutations,
  type DatabaseVariant,
  type InputVariant 
} from '../src/variant_tools';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Genotype Matching', () => {
  let snpDatabase: Record<string, DatabaseVariant>;
  let userVariants: Record<string, InputVariant>;
  
  beforeAll(async () => {
    // Mock fetch to return actual structured data
    mockFetch.mockImplementation(async (url: string) => {
      const filePath = path.join(process.cwd(), url.replace(/^\//, ''));
      const data = fs.readFileSync(filePath, 'utf8');
      return {
        json: async () => JSON.parse(data)
      };
    });
    
    // Load real demo genome data
    const demoGenomeContent = fs.readFileSync('./public/demo_genome.txt', 'utf8');
    userVariants = parseGenomeFile(demoGenomeContent);
    
    // Load SNP database
    snpDatabase = await loadSnpDatabase();
  });

  it('should parse demo genome correctly', () => {
    expect(Object.keys(userVariants).length).toBeGreaterThan(0);
    
    // Check specific SNPs we know are in the demo genome
    expect(userVariants['rs1015362']).toBeDefined();
    expect(userVariants['rs1015362'].genotype).toBe('CC');
    expect(userVariants['rs1015362'].chromosome).toBe('20');
    
    expect(userVariants['rs1006737']).toBeDefined();
    expect(userVariants['rs1006737'].genotype).toBe('GG');
  });

  it('should load structured SNP database correctly', () => {
    expect(Object.keys(snpDatabase).length).toBeGreaterThan(0);
    
    // Check if rs1015362 is loaded
    const rs1015362 = snpDatabase['rs1015362'];
    expect(rs1015362).toBeDefined();
    expect(rs1015362.rsid).toBe('rs1015362');
    expect(rs1015362.genotypes).toBeDefined();
    expect(rs1015362.genotypes!.length).toBeGreaterThan(0);
    
    console.log('Rs1015362 data:', {
      rsid: rs1015362.rsid,
      ref: rs1015362.reference_allele,
      alt: rs1015362.alternative_allele,
      genotypes: rs1015362.genotypes?.length,
      orientation: rs1015362.orientation,
      stabilized: rs1015362.stabilized
    });
    
    if (rs1015362.genotypes) {
      console.log('Available genotypes:');
      for (const genotype of rs1015362.genotypes) {
        console.log(`  ${genotype.allele1};${genotype.allele2} - ${genotype.repute} (mag: ${genotype.magnitude})`);
      }
    }
  });

  it('should find genotype matches correctly', () => {
    const rs1015362 = snpDatabase['rs1015362'];
    expect(rs1015362).toBeDefined();
    
    // User has CC, should match one of the genotypes
    const userVariant = userVariants['rs1015362'];
    expect(userVariant).toBeDefined();
    expect(userVariant.genotype).toBe('CC');
    
    // Check if we have genotypes
    expect(rs1015362.genotypes).toBeDefined();
    expect(rs1015362.genotypes!.length).toBeGreaterThan(0);
    
    // Manual genotype matching test with orientation handling
    const userAlleles = userVariant.genotype; // "CC"
    console.log(`User alleles: ${userAlleles}`);
    console.log(`Orientation: ${rs1015362.orientation}, Stabilized: ${rs1015362.stabilized}`);
    
    // Apply orientation flipping manually (CC -> GG when orientation is minus)
    let processedAlleles = userAlleles;
    if (rs1015362.orientation === 'minus' || rs1015362.stabilized === 'minus') {
      const complement = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
      processedAlleles = userAlleles.split('').map(allele => complement[allele] || allele).join('');
      console.log(`After orientation flip: ${userAlleles} -> ${processedAlleles}`);
    }
    
    const [allele1, allele2] = processedAlleles.split('');
    
    let foundMatch = false;
    for (const genotype of rs1015362.genotypes!) {
      console.log(`Checking ${genotype.allele1};${genotype.allele2} vs processed user ${allele1};${allele2}`);
      if ((allele1 === genotype.allele1 && allele2 === genotype.allele2) ||
          (allele1 === genotype.allele2 && allele2 === genotype.allele1)) {
        console.log(`MATCH FOUND: ${genotype.allele1};${genotype.allele2}`);
        foundMatch = true;
        break;
      }
    }
    
    expect(foundMatch).toBe(true);
  });

  it('should find shared variants with genotype matching', () => {
    const results = findSharedVariants(userVariants, {}, snpDatabase);
    
    console.log(`Found ${results.length} total variants`);
    
    // Check if rs1015362 is in results
    const rs1015362Result = results.find(r => r.rsid === 'rs1015362');
    
    if (rs1015362Result) {
      console.log('Rs1015362 result:', {
        rsid: rs1015362Result.rsid,
        user_allele: rs1015362Result.user_allele,
        source: rs1015362Result.source,
        has_matched_genotype: !!rs1015362Result.matched_genotype,
        matched_genotype: rs1015362Result.matched_genotype ? 
          `${rs1015362Result.matched_genotype.allele1};${rs1015362Result.matched_genotype.allele2}` : 
          'none'
      });
      
      expect(rs1015362Result.matched_genotype).toBeDefined();
      expect(rs1015362Result.user_allele).toBe('CC');
    } else {
      console.log('Rs1015362 NOT found in results');
      
      // Let's check why it's not included
      const userVariant = userVariants['rs1015362'];
      const dbVariant = snpDatabase['rs1015362'];
      
      console.log('Debug info:');
      console.log('- User variant exists:', !!userVariant);
      console.log('- DB variant exists:', !!dbVariant);
      if (userVariant) console.log('- User genotype:', userVariant.genotype);
      if (dbVariant) {
        console.log('- DB has genotypes:', !!dbVariant.genotypes);
        console.log('- DB genotypes count:', dbVariant.genotypes?.length || 0);
      }
    }
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('should convert variants to mutations correctly', () => {
    const results = findSharedVariants(userVariants, {}, snpDatabase);
    const mutations = convertToMutations(results);
    
    console.log(`Converted ${results.length} variants to ${mutations.length} mutations`);
    
    expect(mutations.length).toBeGreaterThan(0);
    
    // Check if any mutations have the new fields
    const mutationsWithGenotypes = mutations.filter(m => m.matched_genotype);
    console.log(`Mutations with matched genotypes: ${mutationsWithGenotypes.length}`);
    
    if (mutationsWithGenotypes.length > 0) {
      const example = mutationsWithGenotypes[0];
      console.log('Example mutation with genotype:', {
        rsid: example.rsid,
        user_allele: example.user_allele,
        magnitude: example.magnitude,
        repute: example.repute,
        summary: example.summary
      });
      
      expect(example.user_allele).toBeDefined();
      expect(example.matched_genotype).toBeDefined();
    }
  });
});
