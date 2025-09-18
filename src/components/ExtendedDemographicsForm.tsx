import type { ExtendedDemographics, DiabetesType, StressLevel, CheckupFrequency } from "../models";
import { cn } from "../tools";

interface ExtendedDemographicsFormProps {
  extendedDemographics: ExtendedDemographics;
  onChange: (extendedDemographics: ExtendedDemographics) => void;
  disabled?: boolean;
}

const DIABETES_OPTIONS: { value: DiabetesType; label: string }[] = [
  { value: "None", label: "None" },
  { value: "Type 1", label: "Type 1" },
  { value: "Type 2", label: "Type 2" },
];

const STRESS_OPTIONS: { value: StressLevel; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "often", label: "Often" },
  { value: "always", label: "Always" },
];

const CHECKUP_OPTIONS: { value: CheckupFrequency; label: string }[] = [
  { value: "<1 year", label: "Less than 1 year" },
  { value: "1–3 years", label: "1-3 years" },
  { value: ">3 years", label: "More than 3 years" },
  { value: "never", label: "Never" },
];

export default function ExtendedDemographicsForm({
  extendedDemographics,
  onChange,
  disabled,
}: ExtendedDemographicsFormProps) {
  const handleChange = (field: keyof ExtendedDemographics, value: unknown) => {
    onChange({ ...extendedDemographics, [field]: value });
  };

  const handleNumberChange = (field: keyof ExtendedDemographics, value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    handleChange(field, numValue);
  };

  const handleBooleanChange = (field: keyof ExtendedDemographics, value: string) => {
    const boolValue = value === "yes" ? true : value === "no" ? false : undefined;
    handleChange(field, boolValue);
  };

  const inputClassName = cn(
    "block w-full rounded-md border-gray-300 shadow-sm py-2 px-3",
    "focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
    disabled && "bg-gray-100 cursor-not-allowed"
  );

  const selectClassName = cn(
    "block w-full rounded-md border-gray-300 shadow-sm py-2 px-3",
    "focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
    disabled && "bg-gray-100 cursor-not-allowed"
  );

  return (
    <div className="space-y-8">
      {/* Basic Demographics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Demographics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="height" className="block text-sm font-medium text-gray-700">
              Height (cm)
            </label>
            <input
              id="height"
              type="number"
              min="0"
              max="300"
              value={extendedDemographics.height || ""}
              onChange={(e) => handleNumberChange("height", e.target.value)}
              disabled={disabled}
              className={inputClassName}
              placeholder="Enter height in cm"
            />
          </div>
        </div>
      </div>

      {/* Lifestyle & Habits */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lifestyle & Habits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="exercise" className="block text-sm font-medium text-gray-700">
              Exercise days per week (0-7)
            </label>
            <input
              id="exercise"
              type="number"
              min="0"
              max="7"
              value={extendedDemographics.exerciseDaysPerWeek || ""}
              onChange={(e) => handleNumberChange("exerciseDaysPerWeek", e.target.value)}
              disabled={disabled}
              className={inputClassName}
              placeholder="Days per week"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="sleep" className="block text-sm font-medium text-gray-700">
              Sleep hours per night
            </label>
            <input
              id="sleep"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={extendedDemographics.sleepHoursPerNight || ""}
              onChange={(e) => handleNumberChange("sleepHoursPerNight", e.target.value)}
              disabled={disabled}
              className={inputClassName}
              placeholder="Hours per night"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Do you smoke?
            </label>
            <select
              value={extendedDemographics.smoker === undefined ? "" : extendedDemographics.smoker ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("smoker", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="alcohol" className="block text-sm font-medium text-gray-700">
              Alcoholic drinks per week
            </label>
            <input
              id="alcohol"
              type="number"
              min="0"
              value={extendedDemographics.alcoholDrinksPerWeek || ""}
              onChange={(e) => handleNumberChange("alcoholDrinksPerWeek", e.target.value)}
              disabled={disabled}
              className={inputClassName}
              placeholder="Drinks per week"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="fruitVeg" className="block text-sm font-medium text-gray-700">
              Fruit/vegetable servings per day (0-10+)
            </label>
            <input
              id="fruitVeg"
              type="number"
              min="0"
              max="15"
              value={extendedDemographics.fruitVegServingsPerDay || ""}
              onChange={(e) => handleNumberChange("fruitVegServingsPerDay", e.target.value)}
              disabled={disabled}
              className={inputClassName}
              placeholder="Servings per day"
            />
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Medical History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Do you have high blood pressure?
            </label>
            <select
              value={extendedDemographics.hasHighBloodPressure === undefined ? "" : extendedDemographics.hasHighBloodPressure ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("hasHighBloodPressure", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Do you have diabetes?
            </label>
            <select
              value={extendedDemographics.diabetesType || ""}
              onChange={(e) => handleChange("diabetesType", e.target.value as DiabetesType)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              {DIABETES_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Have you been diagnosed with heart disease or stroke?
            </label>
            <select
              value={extendedDemographics.hasHeartDiseaseOrStroke === undefined ? "" : extendedDemographics.hasHeartDiseaseOrStroke ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("hasHeartDiseaseOrStroke", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Have you been diagnosed with cancer?
            </label>
            <select
              value={extendedDemographics.hasCancer === undefined ? "" : extendedDemographics.hasCancer ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("hasCancer", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mental & Social Health */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mental & Social Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              How often do you feel stressed or anxious?
            </label>
            <select
              value={extendedDemographics.stressLevel || ""}
              onChange={(e) => handleChange("stressLevel", e.target.value as StressLevel)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              {STRESS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Do you feel socially supported (friends/family)?
            </label>
            <select
              value={extendedDemographics.hasSocialSupport === undefined ? "" : extendedDemographics.hasSocialSupport ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("hasSocialSupport", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Have you had trouble concentrating, remembering, or making decisions in the past month?
            </label>
            <select
              value={extendedDemographics.hasConcentrationProblems === undefined ? "" : extendedDemographics.hasConcentrationProblems ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("hasConcentrationProblems", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Family History & Genetics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Family History & Genetics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Any close family history of cardiovascular disease before 60?
            </label>
            <select
              value={extendedDemographics.familyHistoryCardiovascular === undefined ? "" : extendedDemographics.familyHistoryCardiovascular ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("familyHistoryCardiovascular", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Any close family history of cancer?
            </label>
            <select
              value={extendedDemographics.familyHistoryCancer === undefined ? "" : extendedDemographics.familyHistoryCancer ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("familyHistoryCancer", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recent Symptoms & Screening */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Symptoms & Screening</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Have you unintentionally lost weight in the last 6 months?
            </label>
            <select
              value={extendedDemographics.hasUnintentionalWeightLoss === undefined ? "" : extendedDemographics.hasUnintentionalWeightLoss ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("hasUnintentionalWeightLoss", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Do you experience shortness of breath during light activity?
            </label>
            <select
              value={extendedDemographics.hasShortnesOfBreath === undefined ? "" : extendedDemographics.hasShortnesOfBreath ? "yes" : "no"}
              onChange={(e) => handleBooleanChange("hasShortnesOfBreath", e.target.value)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              When was your last health check-up or blood test?
            </label>
            <select
              value={extendedDemographics.lastCheckup || ""}
              onChange={(e) => handleChange("lastCheckup", e.target.value as CheckupFrequency)}
              disabled={disabled}
              className={selectClassName}
            >
              <option value="">Select...</option>
              {CHECKUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
