import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  loadSnpDatabase, 
  loadClinvarDatabase,
  parseGenomeFile, 
  findSharedVariants, 
  convertToMutations
} from '../src/variant_tools';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Complete App Flow Test', () => {
  beforeAll(async () => {
    // Mock fetch to return actual data
    mockFetch.mockImplementation(async (url: string) => {
      const filePath = path.join(process.cwd(), url.replace(/^\//, ''));
      const data = fs.readFileSync(filePath, 'utf8');
      return {
        json: async () => JSON.parse(data)
      };
    });
  });

  it('should simulate the complete app flow from file upload to UI display', async () => {
    console.log('\n=== COMPLETE APP FLOW SIMULATION ===\n');
    
    // Step 1: Simulate file upload and parsing (like handleStart in App.tsx)
    console.log('1. Simulating file upload and parsing...');
    const demoGenomeContent = fs.readFileSync('./public/demo_genome.txt', 'utf8');
    const parsedVariants = parseGenomeFile(demoGenomeContent);
    console.log(`   ✓ Parsed ${Object.keys(parsedVariants).length} variants from demo genome`);
    
    // Step 2: Load databases (like loadAllData in App.tsx)
    console.log('\n2. Loading databases...');
    const clinvarMap = await loadClinvarDatabase();
    const snpDataMap = await loadSnpDatabase();
    console.log(`   ✓ Loaded ${Object.keys(clinvarMap).length} ClinVar variants`);
    console.log(`   ✓ Loaded ${Object.keys(snpDataMap).length} SNPedia variants`);
    
    // Step 3: Find shared variants (like in handleStart)
    console.log('\n3. Finding shared variants...');
    const sharedVariants = findSharedVariants(parsedVariants, clinvarMap, snpDataMap);
    console.log(`   ✓ Found ${sharedVariants.length} shared variants`);
    
    const clinvarShared = sharedVariants.filter(v => v.source === 'clinvar');
    const snpediaShared = sharedVariants.filter(v => v.source === 'snpedia');
    const snpediaWithGenotypes = snpediaShared.filter(v => v.matched_genotype);
    
    console.log(`   - ClinVar: ${clinvarShared.length}`);
    console.log(`   - SNPedia: ${snpediaShared.length}`);
    console.log(`   - SNPedia with genotypes: ${snpediaWithGenotypes.length}`);
    
    // Step 4: Convert to mutations (like generateRealReport)
    console.log('\n4. Converting to mutations...');
    const mutations = convertToMutations(sharedVariants);
    console.log(`   ✓ Converted to ${mutations.length} mutations`);
    
    const clinvarMutations = mutations.filter(m => m.source === 'clinvar');
    const snpediaMutations = mutations.filter(m => m.source === 'snpedia');
    const snpediaMutationsWithGenotypes = mutations.filter(m => m.source === 'snpedia' && m.matched_genotype);
    
    console.log(`   - ClinVar mutations: ${clinvarMutations.length}`);
    console.log(`   - SNPedia mutations: ${snpediaMutations.length}`);
    console.log(`   - SNPedia with genotypes: ${snpediaMutationsWithGenotypes.length}`);
    
    // Step 5: Test the EXACT UI filter from ReportLayout
    console.log('\n5. Testing UI filter...');
    const uiFiltered = mutations.filter((mutation) => 
      mutation.source === "snpedia" && mutation.matched_genotype
    );
    console.log(`   ✓ UI filter result: ${uiFiltered.length} mutations`);
    
    // Step 6: Check specific examples
    if (uiFiltered.length > 0) {
      console.log('\n6. ✅ SUCCESS! Example mutations:');
      for (const mutation of uiFiltered.slice(0, 3)) {
        console.log(`   - ${mutation.rsid}: ${mutation.user_allele} -> ${mutation.matched_genotype.allele1};${mutation.matched_genotype.allele2}`);
        console.log(`     Repute: ${mutation.matched_genotype.repute}, Magnitude: ${mutation.matched_genotype.magnitude}`);
        console.log(`     Summary: ${mutation.matched_genotype.summary}`);
      }
      
      // Check rs1015362 specifically
      const rs1015362 = uiFiltered.find(m => m.rsid === 'rs1015362');
      if (rs1015362) {
        console.log(`\n   Rs1015362 found in UI filter:`);
        console.log(`   - User: ${rs1015362.user_allele} -> Genotype: ${rs1015362.matched_genotype.allele1};${rs1015362.matched_genotype.allele2}`);
        console.log(`   - ${rs1015362.matched_genotype.repute} (magnitude ${rs1015362.matched_genotype.magnitude})`);
        console.log(`   - ${rs1015362.matched_genotype.summary}`);
      }
    } else {
      console.log('\n6. ❌ STILL EMPTY - This should not happen!');
    }
    
    // Assertions
    expect(sharedVariants.length).toBeGreaterThan(0);
    expect(snpediaWithGenotypes.length).toBeGreaterThan(0);
    expect(mutations.length).toBeGreaterThan(0);
    expect(snpediaMutationsWithGenotypes.length).toBeGreaterThan(0);
    expect(uiFiltered.length).toBeGreaterThan(0);
    
    // Verify rs1015362 specifically
    const rs1015362Result = uiFiltered.find(m => m.rsid === 'rs1015362');
    expect(rs1015362Result).toBeDefined();
    expect(rs1015362Result?.matched_genotype).toBeDefined();
    
    console.log('\n=== APP FLOW TEST COMPLETE ===');
  });
});
