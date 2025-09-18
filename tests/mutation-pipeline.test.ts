import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  loadSnpDatabase, 
  parseGenomeFile, 
  findSharedVariants, 
  convertToMutations,
  type DatabaseVariant,
  type InputVariant,
  type ResultVariant 
} from '../src/variant_tools';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Mutation Pipeline Debug', () => {
  let snpDatabase: Record<string, DatabaseVariant>;
  let userVariants: Record<string, InputVariant>;
  let sharedVariants: ResultVariant[];
  let mutations: any[];
  
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
    
    // Get shared variants
    sharedVariants = findSharedVariants(userVariants, {}, snpDatabase);
    
    // Convert to mutations
    mutations = convertToMutations(sharedVariants);
  });

  it('should have shared variants from SNPedia with matched genotypes', () => {
    console.log(`\n=== Shared Variants Analysis ===`);
    console.log(`Total shared variants: ${sharedVariants.length}`);
    
    const snpediaVariants = sharedVariants.filter(v => v.source === 'snpedia');
    console.log(`SNPedia variants: ${snpediaVariants.length}`);
    
    const snpediaWithGenotypes = snpediaVariants.filter(v => v.matched_genotype);
    console.log(`SNPedia with matched genotypes: ${snpediaWithGenotypes.length}`);
    
    // Show first few examples
    console.log(`\nFirst 5 SNPedia variants with genotypes:`);
    for (const variant of snpediaWithGenotypes.slice(0, 5)) {
      console.log(`  ${variant.rsid}: ${variant.user_allele} -> ${variant.matched_genotype?.allele1};${variant.matched_genotype?.allele2} (${variant.matched_genotype?.repute})`);
    }
    
    expect(snpediaWithGenotypes.length).toBeGreaterThan(0);
  });

  it('should convert shared variants to mutations correctly', () => {
    console.log(`\n=== Mutation Conversion Analysis ===`);
    console.log(`Total mutations: ${mutations.length}`);
    
    const snpediaMutations = mutations.filter(m => m.source === 'snpedia');
    console.log(`SNPedia mutations: ${snpediaMutations.length}`);
    
    const snpediaMutationsWithGenotypes = mutations.filter(m => m.source === 'snpedia' && m.matched_genotype);
    console.log(`SNPedia mutations with matched_genotype: ${snpediaMutationsWithGenotypes.length}`);
    
    // Check the structure of converted mutations
    if (snpediaMutationsWithGenotypes.length > 0) {
      const example = snpediaMutationsWithGenotypes[0];
      console.log(`\nExample mutation structure:`, {
        rsid: example.rsid,
        source: example.source,
        user_allele: example.user_allele,
        has_matched_genotype: !!example.matched_genotype,
        magnitude: example.magnitude,
        repute: example.repute,
        summary: example.summary
      });
    }
    
    expect(snpediaMutationsWithGenotypes.length).toBeGreaterThan(0);
  });

  it('should match the UI filter condition exactly', () => {
    console.log(`\n=== UI Filter Debug ===`);
    
    // Simulate the exact filter used in the UI
    const uiFilteredMutations = mutations.filter((mutation) => 
      mutation.source === "snpedia" && mutation.matched_genotype
    );
    
    console.log(`UI filtered mutations: ${uiFilteredMutations.length}`);
    
    if (uiFilteredMutations.length === 0) {
      console.log(`\nDebugging why filter returns empty:`);
      
      // Check each condition separately
      const snpediaMutations = mutations.filter(m => m.source === "snpedia");
      console.log(`  Mutations with source=snpedia: ${snpediaMutations.length}`);
      
      const mutationsWithGenotype = mutations.filter(m => m.matched_genotype);
      console.log(`  Mutations with matched_genotype: ${mutationsWithGenotype.length}`);
      
      // Check what sources we actually have
      const sources = [...new Set(mutations.map(m => m.source))];
      console.log(`  Available sources: ${sources.join(', ')}`);
      
      // Check if matched_genotype field exists
      const hasMatchedGenotypeField = mutations.some(m => 'matched_genotype' in m);
      console.log(`  Any mutation has matched_genotype field: ${hasMatchedGenotypeField}`);
      
      // Show first few mutations structure
      console.log(`\nFirst 3 mutations structure:`);
      for (const mutation of mutations.slice(0, 3)) {
        console.log(`  ${mutation.rsid}:`, {
          source: mutation.source,
          has_matched_genotype_field: 'matched_genotype' in mutation,
          matched_genotype_value: mutation.matched_genotype,
          user_allele: mutation.user_allele
        });
      }
    } else {
      console.log(`First 3 UI filtered mutations:`);
      for (const mutation of uiFilteredMutations.slice(0, 3)) {
        console.log(`  ${mutation.rsid}: ${mutation.user_allele} -> ${mutation.matched_genotype?.allele1};${mutation.matched_genotype?.allele2}`);
      }
    }
    
    expect(uiFilteredMutations.length).toBeGreaterThan(0);
  });

  it('should have rs1015362 in the final mutations with matched genotype', () => {
    console.log(`\n=== Rs1015362 Pipeline Debug ===`);
    
    // Check each step of the pipeline for rs1015362
    const rsid = 'rs1015362';
    
    // Step 1: User variant
    const userVariant = userVariants[rsid];
    console.log(`1. User variant exists: ${!!userVariant}`);
    if (userVariant) {
      console.log(`   Genotype: ${userVariant.genotype}`);
    }
    
    // Step 2: Database variant
    const dbVariant = snpDatabase[rsid];
    console.log(`2. Database variant exists: ${!!dbVariant}`);
    if (dbVariant) {
      console.log(`   Genotypes: ${dbVariant.genotypes?.length || 0}`);
      console.log(`   Orientation: ${dbVariant.orientation}, Stabilized: ${dbVariant.stabilized}`);
    }
    
    // Step 3: Shared variant
    const sharedVariant = sharedVariants.find(v => v.rsid === rsid);
    console.log(`3. Shared variant exists: ${!!sharedVariant}`);
    if (sharedVariant) {
      console.log(`   Source: ${sharedVariant.source}`);
      console.log(`   User allele: ${sharedVariant.user_allele}`);
      console.log(`   Has matched genotype: ${!!sharedVariant.matched_genotype}`);
      if (sharedVariant.matched_genotype) {
        console.log(`   Matched: ${sharedVariant.matched_genotype.allele1};${sharedVariant.matched_genotype.allele2}`);
      }
    }
    
    // Step 4: Final mutation
    const finalMutation = mutations.find(m => m.rsid === rsid);
    console.log(`4. Final mutation exists: ${!!finalMutation}`);
    if (finalMutation) {
      console.log(`   Source: ${finalMutation.source}`);
      console.log(`   User allele: ${finalMutation.user_allele}`);
      console.log(`   Has matched_genotype field: ${'matched_genotype' in finalMutation}`);
      console.log(`   Matched genotype value: ${!!finalMutation.matched_genotype}`);
      if (finalMutation.matched_genotype) {
        console.log(`   Genotype: ${finalMutation.matched_genotype.allele1};${finalMutation.matched_genotype.allele2}`);
        console.log(`   Summary: ${finalMutation.matched_genotype.summary}`);
      }
    }
    
    expect(finalMutation).toBeDefined();
    expect(finalMutation?.source).toBe('snpedia');
    expect(finalMutation?.matched_genotype).toBeDefined();
  });

  it('should pass the exact UI filter after conversion fix', () => {
    console.log(`\n=== UI Filter After Fix ===`);
    
    // Test the exact filter condition used in the UI
    const uiFilteredMutations = mutations.filter((mutation) => 
      mutation.source === "snpedia" && mutation.matched_genotype
    );
    
    console.log(`UI filtered mutations: ${uiFilteredMutations.length}`);
    
    if (uiFilteredMutations.length > 0) {
      console.log(`✅ SUCCESS! First 3 filtered mutations:`);
      for (const mutation of uiFilteredMutations.slice(0, 3)) {
        console.log(`  ${mutation.rsid}: ${mutation.user_allele} -> ${mutation.matched_genotype.allele1};${mutation.matched_genotype.allele2} (${mutation.repute})`);
      }
    } else {
      console.log(`❌ STILL EMPTY - debugging further...`);
      
      // Check what we have
      const snpediaMutations = mutations.filter(m => m.source === "snpedia");
      const mutationsWithGenotype = mutations.filter(m => m.matched_genotype);
      
      console.log(`  SNPedia mutations: ${snpediaMutations.length}`);
      console.log(`  Mutations with matched_genotype: ${mutationsWithGenotype.length}`);
      
      if (snpediaMutations.length > 0) {
        console.log(`  First SNPedia mutation:`, {
          rsid: snpediaMutations[0].rsid,
          source: snpediaMutations[0].source,
          has_matched_genotype: !!snpediaMutations[0].matched_genotype
        });
      }
    }
    
    expect(uiFilteredMutations.length).toBeGreaterThan(0);
  });
});
