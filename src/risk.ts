// src/services/ascvdCalculator.ts

// --- TYPE DEFINITIONS ---

/**
 * Defines the input parameters required for the ASCVD risk calculation.
 */
export interface ASCVDRiskFactors {
  /** The patient's age in years. Must be between 40 and 79. */
  age: number;
  /** The patient's sex. True if male. */
  isMale: boolean;
  /** The patient's race. True if Black. */
  isBlack: boolean;
  /** The patient's smoking status. True if a current smoker. */
  isSmoker: boolean;
  /** Patient has a history of diabetes. */
  isDiabetic: boolean;
  /** Patient is currently treated for hypertension. */
  isHypertensive: boolean;
  /** Systolic blood pressure in mm Hg. */
  systolicBloodPressure: number;
  /** Total cholesterol in mg/dL. */
  totalCholesterol: number;
  /** HDL cholesterol in mg/dL. */
  hdl: number;
}


// --- MAIN EXPORTED FUNCTION ---

/**
 * 🩺 Calculates the 10-year risk of Atherosclerotic Cardiovascular Disease (ASCVD).
 * Based on the 2013 Pooled Cohort Equations.
 * @param factors An object containing all the required risk factors.
 * @returns The 10-year risk percentage (e.g., 5.4 for 5.4%), or null if the age is outside the 40-79 range. It should be used with Coronary Artery Disease PRS for better risk stratification.
 */
export function calculateASCVDRisk(factors: ASCVDRiskFactors): number | null {
  const {
    age,
    isMale,
    isBlack,
    isSmoker,
    isDiabetic,
    isHypertensive,
    systolicBloodPressure,
    totalCholesterol,
    hdl
  } = factors;

  // The formula is only validated for ages 40-79.
  if (age < 40 || age > 79) {
    return null;
  }

  // Pre-calculate logs of base values
  const lnAge = Math.log(age);
  const lnTotalChol = Math.log(totalCholesterol);
  const lnHdl = Math.log(hdl);
  const lnSbp = Math.log(systolicBloodPressure);

  // Separate treated vs. untreated systolic blood pressure terms
  const trlnSbp = isHypertensive ? lnSbp : 0;
  const ntlnSbp = isHypertensive ? 0 : lnSbp;
  
  // Pre-calculate interaction terms
  const ageTotalChol = lnAge * lnTotalChol;
  const ageHdl = lnAge * lnHdl;
  const ageTrSbp = lnAge * trlnSbp;
  const ageNtSbp = lnAge * ntlnSbp;
  const ageSmoke = isSmoker ? lnAge : 0;

  let s010Ret: number; // Baseline survival probability
  let mnxbRet: number; // Mean of the predictor variables
  let predictRet: number; // Sum of the weighted risk factors

  // The coefficients depend on the patient's sex and race.
  if (isBlack && !isMale) { // Black Female
    s010Ret = 0.95334;
    mnxbRet = 86.6081;
    predictRet = 17.1141 * lnAge
      + 0.9396 * lnTotalChol
      + -18.9196 * lnHdl
      + 4.4748 * ageHdl
      + 29.2907 * trlnSbp
      + -6.4321 * ageTrSbp
      + 27.8197 * ntlnSbp
      + -6.0873 * ageNtSbp
      + (isSmoker ? 0.6908 : 0)
      + (isDiabetic ? 0.8738 : 0);
  } else if (!isBlack && !isMale) { // White/Other Female
    s010Ret = 0.96652;
    mnxbRet = -29.1817;
    predictRet = -29.799 * lnAge
      + 4.884 * (lnAge ** 2)
      + 13.540 * lnTotalChol
      + -3.114 * ageTotalChol
      + -13.578 * lnHdl
      + 3.149 * ageHdl
      + 2.019 * trlnSbp
      + 1.957 * ntlnSbp
      + (isSmoker ? 7.574 : 0)
      + -1.665 * ageSmoke
      + (isDiabetic ? 0.661 : 0);
  } else if (isBlack && isMale) { // Black Male
    s010Ret = 0.89536;
    mnxbRet = 19.5425;
    predictRet = 2.469 * lnAge
      + 0.302 * lnTotalChol
      + -0.307 * lnHdl
      + 1.916 * trlnSbp
      + 1.809 * ntlnSbp
      + (isSmoker ? 0.549 : 0)
      + (isDiabetic ? 0.645 : 0);
  } else { // White/Other Male
    s010Ret = 0.91436;
    mnxbRet = 61.1816;
    predictRet = 12.344 * lnAge
      + 11.853 * lnTotalChol
      + -2.664 * ageTotalChol
      + -7.990 * lnHdl
      + 1.769 * ageHdl
      + 1.797 * trlnSbp
      + 1.764 * ntlnSbp
      + (isSmoker ? 7.837 : 0)
      + -1.795 * ageSmoke
      + (isDiabetic ? 0.658 : 0);
  }

  const risk = 1 - (s010Ret ** Math.exp(predictRet - mnxbRet));
  const riskPercentage = risk * 100;

  // Round to one decimal place
  return Math.round(riskPercentage * 10) / 10;
}