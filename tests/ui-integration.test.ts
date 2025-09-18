import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  loadSnpDatabase, 
  loadClinvarDatabase,
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

describe('UI Integration Debug', () => {
  let snpDatabase: Record<string, DatabaseVariant>;
  let clinvarDatabase: Record<string, DatabaseVariant>;
  let userVariants: Record<string, InputVariant>;
  let sharedVariants: ResultVariant[];
  let mutations: any[];
  
  beforeAll(async () => {
    // Mock fetch to return actual data
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
    
    // Load both databases (like the real app does)
    snpDatabase = await loadSnpDatabase();
    clinvarDatabase = await loadClinvarDatabase();
    
    // Get shared variants (like the real app does)
    sharedVariants = findSharedVariants(userVariants, clinvarDatabase, snpDatabase);
    
    // Convert to mutations (like the real app does)
    mutations = convertToMutations(sharedVariants);
  });

  it('should simulate the exact app flow and debug each step', () => {
    console.log(`\n=== EXACT APP FLOW SIMULATION ===`);
    
    // Step 1: Check what we loaded
    console.log(`1. Data Loading:`);
    console.log(`   - User variants: ${Object.keys(userVariants).length}`);
    console.log(`   - ClinVar database: ${Object.keys(clinvarDatabase).length}`);
    console.log(`   - SNPedia database: ${Object.keys(snpDatabase).length}`);
    
    // Step 2: Check shared variants
    console.log(`\n2. Shared Variants:`);
    console.log(`   - Total: ${sharedVariants.length}`);
    
    const clinvarShared = sharedVariants.filter(v => v.source === 'clinvar');
    const snpediaShared = sharedVariants.filter(v => v.source === 'snpedia');
    console.log(`   - ClinVar: ${clinvarShared.length}`);
    console.log(`   - SNPedia: ${snpediaShared.length}`);
    
    const snpediaWithGenotypes = snpediaShared.filter(v => v.matched_genotype);
    console.log(`   - SNPedia with matched genotypes: ${snpediaWithGenotypes.length}`);
    
    // Step 3: Check mutations after conversion
    console.log(`\n3. After convertToMutations:`);
    console.log(`   - Total mutations: ${mutations.length}`);
    
    const clinvarMutations = mutations.filter(m => m.source === 'clinvar');
    const snpediaMutations = mutations.filter(m => m.source === 'snpedia');
    console.log(`   - ClinVar mutations: ${clinvarMutations.length}`);
    console.log(`   - SNPedia mutations: ${snpediaMutations.length}`);
    
    const snpediaMutationsWithGenotypes = mutations.filter(m => m.source === 'snpedia' && m.matched_genotype);
    console.log(`   - SNPedia mutations with matched_genotype: ${snpediaMutationsWithGenotypes.length}`);
    
    // Step 4: Test the EXACT UI filter
    console.log(`\n4. UI Filter Test:`);
    const uiFiltered = mutations.filter((mutation) => 
      mutation.source === "snpedia" && mutation.matched_genotype
    );
    console.log(`   - UI filtered result: ${uiFiltered.length}`);
    
    // Step 5: Check mutation structure in detail
    if (uiFiltered.length > 0) {
      console.log(`\n5. ✅ SUCCESS - First mutation structure:`);
      const first = uiFiltered[0];
      console.log(`   - RSID: ${first.rsid}`);
      console.log(`   - Source: ${first.source}`);
      console.log(`   - User allele: ${first.user_allele}`);
      console.log(`   - Has matched_genotype: ${!!first.matched_genotype}`);
      console.log(`   - Matched genotype: ${first.matched_genotype?.allele1};${first.matched_genotype?.allele2}`);
      console.log(`   - Repute: ${first.matched_genotype?.repute}`);
      console.log(`   - Magnitude: ${first.matched_genotype?.magnitude}`);
    } else {
      console.log(`\n5. ❌ STILL EMPTY - Deep debugging:`);
      
      // Check if we have ANY SNPedia mutations at all
      if (snpediaMutations.length === 0) {
        console.log(`   - NO SNPedia mutations found at all!`);
        console.log(`   - But we had ${snpediaShared.length} SNPedia shared variants`);
        
        // Check what happened in conversion
        console.log(`   - First few shared SNPedia variants:`);
        for (const variant of snpediaShared.slice(0, 3)) {
          const hasMatchedGenotype = variant.matched_genotype && 
            parseFloat(variant.matched_genotype.magnitude) > 0;
          const hasBasicInfo = variant.diseases || variant.description;
          const shouldPass = hasMatchedGenotype || hasBasicInfo;
          
          console.log(`     * ${variant.rsid}: matched=${!!variant.matched_genotype}, hasBasicInfo=${hasBasicInfo}, shouldPass=${shouldPass}`);
        }
      } else {
        console.log(`   - We have ${snpediaMutations.length} SNPedia mutations`);
        console.log(`   - First SNPedia mutation:`, {
          rsid: snpediaMutations[0].rsid,
          source: snpediaMutations[0].source,
          has_matched_genotype_field: 'matched_genotype' in snpediaMutations[0],
          matched_genotype_value: snpediaMutations[0].matched_genotype,
          matched_genotype_type: typeof snpediaMutations[0].matched_genotype
        });
      }
    }
    
    expect(uiFiltered.length).toBeGreaterThan(0);
  });

  it('should verify rs1015362 specifically in the UI pipeline', () => {
    console.log(`\n=== RS1015362 SPECIFIC DEBUG ===`);
    
    // Find rs1015362 in each step
    const userVariant = userVariants['rs1015362'];
    const sharedVariant = sharedVariants.find(v => v.rsid === 'rs1015362');
    const mutation = mutations.find(m => m.rsid === 'rs1015362');
    
    console.log(`1. User variant: ${!!userVariant} (${userVariant?.genotype})`);
    console.log(`2. Shared variant: ${!!sharedVariant} (source: ${sharedVariant?.source})`);
    console.log(`3. Final mutation: ${!!mutation} (source: ${mutation?.source})`);
    
    if (mutation) {
      console.log(`4. Mutation details:`);
      console.log(`   - Source: "${mutation.source}"`);
      console.log(`   - Has matched_genotype field: ${'matched_genotype' in mutation}`);
      console.log(`   - Matched genotype value: ${JSON.stringify(mutation.matched_genotype)}`);
      console.log(`   - User allele: ${mutation.user_allele}`);
      
      // Test the exact filter condition
      const passesFilter = mutation.source === "snpedia" && mutation.matched_genotype;
      console.log(`   - Passes UI filter: ${passesFilter}`);
      
      if (!passesFilter) {
        console.log(`   - Source check: ${mutation.source === "snpedia"}`);
        console.log(`   - Genotype check: ${!!mutation.matched_genotype}`);
      }
    }
    
    expect(mutation).toBeDefined();
    expect(mutation?.source).toBe('snpedia');
    expect(mutation?.matched_genotype).toBeDefined();
  });

  it('should check if there are any type mismatches or serialization issues', () => {
    console.log(`\n=== TYPE AND SERIALIZATION DEBUG ===`);
    
    // Check if matched_genotype might be getting lost in serialization
    const snpediaMutations = mutations.filter(m => m.source === 'snpedia');
    console.log(`SNPedia mutations: ${snpediaMutations.length}`);
    
    if (snpediaMutations.length > 0) {
      const first = snpediaMutations[0];
      console.log(`First SNPedia mutation detailed check:`);
      console.log(`  - RSID: ${first.rsid}`);
      console.log(`  - Source type: ${typeof first.source}`);
      console.log(`  - Source value: "${first.source}"`);
      console.log(`  - Source === "snpedia": ${first.source === "snpedia"}`);
      console.log(`  - matched_genotype type: ${typeof first.matched_genotype}`);
      console.log(`  - matched_genotype truthy: ${!!first.matched_genotype}`);
      console.log(`  - matched_genotype keys: ${first.matched_genotype ? Object.keys(first.matched_genotype) : 'null'}`);
      
      // Test JSON serialization/deserialization
      const serialized = JSON.stringify(first);
      const deserialized = JSON.parse(serialized);
      console.log(`  - After JSON round-trip: source=${deserialized.source}, has_genotype=${!!deserialized.matched_genotype}`);
    }
    
    expect(snpediaMutations.length).toBeGreaterThan(0);
  });
});
