// --- TYPE DEFINITIONS ---

/** Represents a single variant from the user's 23andMe file. (Can be reused from the previous script) */
export interface InputVariant {
  rsid: string;
  genotype: string;
  // Other properties like chromosome, position can be included if needed
}

/** Configuration for a single Polygenic Risk Score. */
export interface PRSConfig {
  /** The display name of the score (e.g., "Coronary Artery Disease"). */
  name: string;
  /** The lower cutoff for risk stratification. */
  lower_cutoff?: number;
  /** The upper cutoff for risk stratification. */
  upper_cutoff?: number;
  /** * Determines risk direction. 
   * If true, a lower score is better (lower risk).
   * If false (default), a higher score is better (lower risk).
   */
  lower_is_better?: boolean;
  // You can add any other metadata for the PRS here
  [key: string]: any;
}

/** The structure for the weights of a single PRS model. */
export interface PRSWeights {
  /** * An array of weight tuples. Each tuple is [effect_weight, effect_allele].
   * The order of this array must correspond to the indices in the indexMap.
   */
  weights: [number, string][];
}

/** The final calculated PRS result, combining config with the user's score and risk level. */
export interface PRSResult extends PRSConfig {
  /** The user's calculated raw score. */
  score: number;
  /** The user's risk category ('low', 'normal', 'high') or the raw score if cutoffs aren't defined. */
  risk: 'low' | 'normal' | 'high' | number;
}


// --- MAIN EXPORTED FUNCTION ---

/**
 * Calculates multiple Polygenic Risk Scores based on user's genotype data.
 * @param inputMap A map of the user's variants (rsid -> variant data).
 * @param indexMap A map of rsid to its corresponding index in the weight arrays. Can be loaded from data_files/prs_23andme_index_map.json
 * @param prsConfigs An array of configuration objects for each PRS to be calculated. Can be loaded from data_files/prs_config.json, property "prs_list"
 * @param allWeights An array of weight objects. The order must match the order of prsConfigs. Can be loaded from data_files/prs_weights.json
 * @returns An array of PRSResult objects with calculated scores and risk levels.
 */
export function calculateAllPrs(
  inputMap: Record<string, InputVariant>,
  indexMap: Record<string, number>,
  prsConfigs: PRSConfig[],
  allWeights: PRSWeights[]
): PRSResult[] {
  // Initialize an array to hold the score for each PRS model
  const cumulativeScores = new Array(prsConfigs.length).fill(0.0);

  // Iterate over each variant in the user's genome data
  for (const rsid in inputMap) {
    // Skip if this variant is not used in any of the PRS models
    if (!(rsid in indexMap)) {
      continue;
    }
    
    const variantIndex = indexMap[rsid];
    const userGenotype = inputMap[rsid].genotype;

    // For this single variant, add its contribution to each PRS score
    for (let j = 0; j < prsConfigs.length; j++) {
      const [effectWeight, effectAllele] = allWeights[j].weights[variantIndex];

      // User is homozygous for the effect allele (e.g., 'GG')
      if (effectAllele + effectAllele === userGenotype) {
        cumulativeScores[j] += effectWeight * 2;
      } 
      // User is heterozygous (e.g., 'AG')
      else if (userGenotype.includes(effectAllele)) {
        cumulativeScores[j] += effectWeight;
      }
    }
  }

  // Map the raw scores to the final result objects with risk categories
  const scoredResults = cumulativeScores.map((score, i) => {
    const config = prsConfigs[i];
    const { 
      lower_cutoff: lCutoff, 
      upper_cutoff: uCutoff, 
      lower_is_better = false // Default to false if not provided
    } = config;

    const result: PRSResult = {
      ...config, // Copy all properties from the original config
      score,
      risk: score, // Default risk is the raw score itself
    };

    // Determine risk category if cutoffs are defined
    if (lCutoff !== undefined && uCutoff !== undefined) {
      if (lower_is_better) {
        if (score <= lCutoff) result.risk = 'low';
        else if (score <= uCutoff) result.risk = 'normal';
        else result.risk = 'high';
      } else { // Higher score is better (lower risk)
        if (score <= lCutoff) result.risk = 'high';
        else if (score <= uCutoff) result.risk = 'normal';
        else result.risk = 'low';
      }
    }
    
    console.log(`PRS ${result.name} score: ${result.score}, risk: ${result.risk}`);
    return result;
  });

  return scoredResults;
}