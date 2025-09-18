import React, { createContext, useContext, useReducer } from "react";
import type {
  AppState,
  Demographics,
  ExtendedDemographics,
  Report,
  ChatMessage,
  StarRating,
  SelectedItem,
} from "./models";
import { DISCLAIMER_TOP, ERR_UNSUPPORTED } from "./assets/copy";
import { getDemographics, saveDemographics, saveReport } from "./db";
import {
  parseGenomeFile,
  parseMyHeritageFile, // CHANGED: Import the new parser
  findSharedVariants,
  convertToMutations,
  loadSnpDatabase,
  loadClinvarDatabase,
} from "./variant_tools";
import { calculateAllPrs, type PRSResult, type PRSConfig } from "./prs";
import UploadPage from "./pages/UploadPage";
import ProcessingPage from "./pages/ProcessingPage";
import ReportPage from "./pages/ReportPage";
import DNABackground from "./components/DNABackground";
import PrivacyToast from "./components/PrivacyToast";
import SystemRequirementsToast from "./components/SystemRequirementsToast";
import MobileErrorScreen from "./components/MobileErrorScreen";
import { useIsMobile } from "./utils/device";
import {
  createProgressFetch,
  type ProgressInfo,
} from "./utils/progressTracker";

// Interface for all loaded data
interface LoadedData {
  clinvarMap: Record<string, any>;
  snpDataMap: Record<string, any>;
  prsConfigs: any[];
  indexMap: Record<string, any>;
  allWeights: any[];
  demoFileContent?: string;
}

// Load all data files in parallel
async function loadAllData(
  fetchWithProgress?: (url: string, phase: string) => Promise<Response>,
  includeDemoFile = false
): Promise<LoadedData> {
  console.log("Loading all data files in parallel...");

  // Define all file URLs and their corresponding phase names
  const fileLoads = [
    {
      url: "/data_files/prs_config.json",
      phase: "Loading PRS configurations",
      key: "prsConfig",
    },
    {
      url: "/data_files/prs_23andme_index_map.json",
      phase: "Loading PRS index map",
      key: "prsIndex",
    },
    {
      url: "/data_files/prs_weights.json",
      phase: "Loading PRS weights",
      key: "prsWeights",
    },
  ];

  // Add demo file if needed
  if (includeDemoFile) {
    fileLoads.push({
      url: "/demo_genome.txt",
      phase: "Loading demo file",
      key: "demoFile",
    });
  }

  // Start all downloads in parallel
  const fetchPromises = fileLoads.map(({ url, phase }) => {
    return fetchWithProgress ? fetchWithProgress(url, phase) : fetch(url);
  });

  const responses = await Promise.all(fetchPromises);

  // Check if all responses are OK
  for (let i = 0; i < responses.length; i++) {
    if (!responses[i].ok) {
      throw new Error(
        `Failed to load ${fileLoads[i].url}: ${responses[i].statusText}`
      );
    }
  }

  // Parse all JSON responses in parallel
  const dataPromises = responses.map((response, index) => {
    const { key } = fileLoads[index];
    return key === "demoFile" ? response.text() : response.json();
  });

  const allData = await Promise.all(dataPromises);

  // Process the data
  const prsConfigs = allData[0];
  const indexMap = allData[1];
  const allWeights = allData[2];
  const demoFileContent = includeDemoFile ? allData[3] : undefined;

  // Load genetic databases using our proper functions
  const clinvarMap = await loadClinvarDatabase(fetchWithProgress);
  const snpDataMap = await loadSnpDatabase(fetchWithProgress);


  console.log(`Loaded ${Object.keys(clinvarMap).length} ClinVar variants`);
  console.log(`Loaded ${Object.keys(snpDataMap).length} SNP data variants`);
  console.log(`Loaded ${prsConfigs.length} PRS configurations`);
  console.log(`Loaded index map with ${Object.keys(indexMap).length} variants`);
  console.log(`Loaded weights for ${allWeights.length} PRS models`);

  return {
    clinvarMap,
    snpDataMap,
    prsConfigs,
    indexMap,
    allWeights,
    demoFileContent,
  };
}

// Filter PRS configs based on user's sex
function filterPRSConfigsBySex(
  prsConfigs: PRSConfig[],
  userSex?: string
): { filteredConfigs: PRSConfig[]; filteredIndices: number[] } {
  if (!userSex || userSex === "Intersex" || userSex === "Prefer not to say") {
    // If no sex specified or non-binary, include all configs
    return {
      filteredConfigs: prsConfigs,
      filteredIndices: prsConfigs.map((_, index) => index),
    };
  }

  // Map demographics sex to PRS config sex format
  const prsConfigSex =
    userSex === "Male" ? "male" : userSex === "Female" ? "female" : null;

  if (!prsConfigSex) {
    // If we can't map the sex, include all configs
    return {
      filteredConfigs: prsConfigs,
      filteredIndices: prsConfigs.map((_, index) => index),
    };
  }

  const filteredData: { config: PRSConfig; originalIndex: number }[] = [];

  prsConfigs.forEach((config, index) => {
    const configSex = config.sex as string;
    // Include if sex matches or if the config is for both sexes
    if (configSex === "both" || configSex === prsConfigSex) {
      filteredData.push({ config, originalIndex: index });
    }
  });

  return {
    filteredConfigs: filteredData.map((item) => item.config),
    filteredIndices: filteredData.map((item) => item.originalIndex),
  };
}

// Real report generator using genetic analysis results
async function generateRealReport(
  sharedVariants: any[],
  demographics: Demographics,
  extendedDemographics: ExtendedDemographics,
  parsedVariants: Record<string, any>,
  loadedData: LoadedData,
  completePhase?: (phase: string) => void
): Promise<Report> {
  // Convert shared variants to mutations format
  const mutations = convertToMutations(sharedVariants);

  const clinvarCount = sharedVariants.filter(
    (v) => v.source === "clinvar"
  ).length;
  const snpediaCount = sharedVariants.filter(
    (v) => v.source === "snpedia"
  ).length;

  // DEBUG: Check mutations structure
  const snpediaMutations = mutations.filter(m => m.source === 'snpedia');
  const snpediaMutationsWithGenotypes = mutations.filter(m => m.source === 'snpedia' && m.matched_genotype);
  
  console.log(
    `Generated report with ${mutations.length} clinically significant mutations`
  );
  console.log(`  - From ${clinvarCount} ClinVar variants (medical conditions)`);
  console.log(`  - From ${snpediaCount} SNPedia variants (genetic traits)`);
  console.log(`  - SNPedia mutations: ${snpediaMutations.length}`);
  console.log(`  - SNPedia mutations with genotypes: ${snpediaMutationsWithGenotypes.length}`);
  
  // Test the exact UI filter
  const uiFiltered = mutations.filter((mutation) => mutation.source === "snpedia" && mutation.matched_genotype);
  console.log(`  - UI filter test result: ${uiFiltered.length}`);
  
  if (uiFiltered.length > 0) {
    console.log(`  - First UI filtered mutation: ${uiFiltered[0].rsid} (${uiFiltered[0].user_allele})`);
  }

  // Calculate PRS scores using pre-loaded data
  let prsResults: PRSResult[] = [];
  try {
    const { prsConfigs, indexMap, allWeights } = loadedData;

    // Filter PRS configs based on user's sex
    const { filteredConfigs, filteredIndices } = filterPRSConfigsBySex(
      prsConfigs,
      demographics.sexAtBirth
    );

    // Filter the weights array to match the filtered configs
    const filteredWeights = filteredIndices.map((index) => allWeights[index]);

    prsResults = calculateAllPrs(
      parsedVariants,
      indexMap,
      filteredConfigs,
      filteredWeights
    );

    if (completePhase) {
      completePhase("Calculating PRS scores");
    }

    console.log(
      `Calculated ${prsResults.length} PRS scores (filtered by sex: ${demographics.sexAtBirth || "not specified"})`
    );
    console.log(
      `Original configs: ${prsConfigs.length}, Filtered configs: ${filteredConfigs.length}`
    );
  } catch (error) {
    console.error("Failed to calculate PRS scores:", error);
    // Continue without PRS scores
  }

  if (completePhase) {
    completePhase("Generating report");
  }

  return {
    id: `report-${Date.now()}`,
    vendor: "23andMe", // Could be detected from file format
    generatedAt: new Date(),
    mutations,
    demographics,
    extendedDemographics,
    prsResults,
  };
}

// Context for app state
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextType | null>(null);

// Actions
type AppAction =
  | { type: "SET_PHASE"; phase: AppState["phase"] }
  | { type: "SET_FILE"; file: File }
  | { type: "SET_DEMOGRAPHICS"; demographics: Demographics }
  | { type: "SET_EXTENDED_DEMOGRAPHICS"; extendedDemographics: ExtendedDemographics }
  | { type: "SET_REPORT"; report: Report }
  | { type: "SET_SELECTED_MUTATION"; rsid?: string }
  | { type: "SET_SELECTED_ITEM"; item?: SelectedItem }
  | { type: "ADD_CHAT_MESSAGE"; message: ChatMessage }
  | { type: "TOGGLE_SECTION_EXPANDED"; level: StarRating }
  | { type: "SET_CHAT_OPEN"; open: boolean }
  | { type: "SET_PROGRESS"; progress?: ProgressInfo };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, phase: action.phase };

    case "SET_FILE":
      return { ...state, uploadedFile: action.file };

    case "SET_DEMOGRAPHICS":
      return { ...state, demographics: action.demographics };

    case "SET_EXTENDED_DEMOGRAPHICS":
      return { ...state, extendedDemographics: action.extendedDemographics };

    case "SET_REPORT":
      return { ...state, report: action.report, phase: "report" };

    case "SET_SELECTED_MUTATION":
      return { ...state, selectedMutationId: action.rsid };

    case "SET_SELECTED_ITEM":
      return { ...state, selectedItem: action.item };

    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.message],
      };

    case "TOGGLE_SECTION_EXPANDED":
      return {
        ...state,
        uiPreferences: {
          ...state.uiPreferences,
          sectionsExpanded: {
            ...state.uiPreferences.sectionsExpanded,
            [action.level]: !state.uiPreferences.sectionsExpanded[action.level],
          },
        },
      };

    case "SET_CHAT_OPEN":
      return {
        ...state,
        uiPreferences: {
          ...state.uiPreferences,
          chatOpen: action.open,
        },
      };

    case "SET_PROGRESS":
      return {
        ...state,
        progressInfo: action.progress,
      };

    default:
      return state;
  }
}

// Hook to use app context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}

// Hook to detect online/offline status

// Main App component
function AppContent() {
  const { state, dispatch } = useAppContext();

  // File validation
  const validateFile = (file: File): boolean => {
    // CHANGED: Added .csv to the list of valid extensions
    const validExtensions = [".txt", ".vcf", ".csv"];
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    return hasValidExtension;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) {
      alert(ERR_UNSUPPORTED);
      return;
    }
    dispatch({ type: "SET_FILE", file });
  };

  // Handle demographics change
  const handleDemographicsChange = (demographics: Demographics) => {
    dispatch({ type: "SET_DEMOGRAPHICS", demographics });
    saveDemographics(demographics);
  };

  // Handle extended demographics change
  const handleExtendedDemographicsChange = (extendedDemographics: ExtendedDemographics) => {
    dispatch({ type: "SET_EXTENDED_DEMOGRAPHICS", extendedDemographics });
    // Update the report with new extended demographics if we have one
    if (state.report) {
      const updatedReport = {
        ...state.report,
        extendedDemographics,
      };
      dispatch({ type: "SET_REPORT", report: updatedReport });
      saveReport(updatedReport);
    }
  };

  // Handle start processing
  const handleStart = async () => {
    if (!state.uploadedFile) return;

    // IMMEDIATELY show loading screen
    dispatch({ type: "SET_PHASE", phase: "processing" });
    dispatch({ type: "SET_PROGRESS", progress: undefined });

    // Use setTimeout to ensure UI updates before heavy operations
    setTimeout(async () => {
      // Define processing phases with weights for progress calculation
      const phases = [
        { name: "Loading ClinVar database", weight: 40 },
        { name: "Loading SNPedia database", weight: 20 },
        { name: "Loading PRS configurations", weight: 10 },
        { name: "Loading PRS index map", weight: 5 },
        { name: "Loading PRS weights", weight: 5 },
        { name: "Parsing genome file", weight: 5 },
        { name: "Finding shared variants", weight: 10 },
        { name: "Calculating PRS scores", weight: 3 },
        { name: "Generating report", weight: 2 },
      ];

      // Create progress tracker
      const { fetchWithProgress, completePhase } = createProgressFetch(
        (progressInfo) => {
          dispatch({ type: "SET_PROGRESS", progress: progressInfo });
        },
        phases
      );

      try {
        // Load ALL data files in parallel first
        console.log("Starting parallel data loading...");
        const loadedData = await loadAllData(fetchWithProgress, false);

        // Parse the uploaded file
        const fileContent = await state.uploadedFile!.text();

        // --- CHANGED: Conditional parsing logic ---
        let parsedVariants: Record<string, any>;
        const fileName = state.uploadedFile!.name.toLowerCase();

        if (fileName.endsWith(".csv")) {
          console.log("Parsing as MyHeritage file (.csv)");
          parsedVariants = parseMyHeritageFile(fileContent);
        } else if (fileName.endsWith(".txt")) {
          console.log("Parsing as 23andMe file (.txt)");
          parsedVariants = parseGenomeFile(fileContent);
        } else {
          // This case is a fallback, validateFile should prevent this
          throw new Error("Unsupported file type provided.");
        }
        // --- END OF CHANGES ---

        console.log(
          `Parsed ${Object.keys(parsedVariants).length} variants from file`
        );

        // Find shared variants between user genome and databases
        const sharedVariants = findSharedVariants(
          parsedVariants,
          loadedData.clinvarMap,
          loadedData.snpDataMap
        );

        console.log(
          `Found ${sharedVariants.length} shared variants with clinical significance`
        );

        // Log breakdown by source
        const clinvarCount = sharedVariants.filter(
          (v) => v.source === "clinvar"
        ).length;
        const snpediaCount = sharedVariants.filter(
          (v) => v.source === "snpedia"
        ).length;

        // Count variants with conditions
        const withConditions = sharedVariants.filter(
          (v) =>
            (v.source === "clinvar" &&
              v.phenotype &&
              v.phenotype.trim() !== "") ||
            (v.source === "snpedia" && v.diseases && v.diseases.trim() !== "")
        ).length;
        const withoutConditions = sharedVariants.length - withConditions;

        console.log(
          `ClinVar variants: ${clinvarCount}, SNPedia variants: ${snpediaCount}`
        );
        console.log(
          `With conditions: ${withConditions}, Without conditions: ${withoutConditions} (sorted to end)`
        );

        // Log first few results to show sorting
        if (sharedVariants.length > 0) {
          console.log(
            "First 3 sorted results:",
            sharedVariants.slice(0, 3).map((v) => ({
              rsid: v.rsid,
              source: v.source,
              genotype: v.genotype,
              condition:
                v.source === "clinvar"
                  ? v.phenotype || "N/A"
                  : v.diseases || "N/A",
              gene_name: v.gene_name || "N/A",
            }))
          );
        }

        // Generate real report using genetic analysis results
        const report = await generateRealReport(
          sharedVariants,
          state.demographics,
          state.extendedDemographics,
          parsedVariants,
          loadedData,
          completePhase
        );
        saveReport(report);
        dispatch({ type: "SET_REPORT", report });
      } catch (error) {
        console.error("Error generating report:", error);
        dispatch({ type: "SET_PHASE", phase: "upload" });
        dispatch({ type: "SET_PROGRESS", progress: undefined });
        alert(
          "An error occurred while processing your file. Please try again."
        );
      }
    }, 0); // Execute on next tick to allow UI to update
  };

  // Handle demo processing
  const handleDemo = async () => {
    // IMMEDIATELY show loading screen
    dispatch({ type: "SET_PHASE", phase: "processing" });
    dispatch({ type: "SET_PROGRESS", progress: undefined });

    // Use setTimeout to ensure UI updates before heavy operations
    setTimeout(async () => {
      // Define processing phases with weights for progress calculation
      const phases = [
        { name: "Loading demo file", weight: 5 },
        { name: "Loading ClinVar database", weight: 40 },
        { name: "Loading SNPedia database", weight: 20 },
        { name: "Loading PRS configurations", weight: 10 },
        { name: "Loading PRS index map", weight: 5 },
        { name: "Loading PRS weights", weight: 5 },
        { name: "Parsing genome file", weight: 5 },
        { name: "Finding shared variants", weight: 7 },
        { name: "Calculating PRS scores", weight: 2 },
        { name: "Generating report", weight: 1 },
      ];

      // Create progress tracker
      const { fetchWithProgress, completePhase } = createProgressFetch(
        (progressInfo) => {
          dispatch({ type: "SET_PROGRESS", progress: progressInfo });
        },
        phases
      );

      try {
        // Load ALL data files in parallel (including demo file)
        console.log("Starting parallel data loading (including demo file)...");
        const loadedData = await loadAllData(fetchWithProgress, true);

        // Create demo file object
        const demoFile = new File(
          [loadedData.demoFileContent!],
          "demo_genome.txt",
          {
            type: "text/plain",
          }
        );

        // Set the demo file
        dispatch({ type: "SET_FILE", file: demoFile });

        // Parse the demo file content
        const parsedVariants = parseGenomeFile(loadedData.demoFileContent!);
        console.log(
          `Parsed ${Object.keys(parsedVariants).length} variants from demo file`
        );

        // Find shared variants between user genome and databases
        const sharedVariants = findSharedVariants(
          parsedVariants,
          loadedData.clinvarMap,
          loadedData.snpDataMap
        );

        console.log(
          `Found ${sharedVariants.length} shared variants with clinical significance`
        );

        // Log breakdown by source
        const clinvarCount = sharedVariants.filter(
          (v) => v.source === "clinvar"
        ).length;
        const snpediaCount = sharedVariants.filter(
          (v) => v.source === "snpedia"
        ).length;

        // Count variants with conditions
        const withConditions = sharedVariants.filter(
          (v) =>
            (v.source === "clinvar" &&
              v.phenotype &&
              v.phenotype.trim() !== "") ||
            (v.source === "snpedia" && v.diseases && v.diseases.trim() !== "")
        ).length;
        const withoutConditions = sharedVariants.length - withConditions;

        console.log(
          `ClinVar variants: ${clinvarCount}, SNPedia variants: ${snpediaCount}`
        );
        console.log(
          `With conditions: ${withConditions}, Without conditions: ${withoutConditions} (sorted to end)`
        );

        // Log first few results to show sorting
        if (sharedVariants.length > 0) {
          console.log(
            "First 3 sorted results:",
            sharedVariants.slice(0, 3).map((v) => ({
              rsid: v.rsid,
              source: v.source,
              genotype: v.genotype,
              condition:
                v.source === "clinvar"
                  ? v.phenotype || "N/A"
                  : v.diseases || "N/A",
              gene_name: v.gene_name || "N/A",
            }))
          );
        }

        // Generate real report using genetic analysis results
        const report = await generateRealReport(
          sharedVariants,
          state.demographics,
          state.extendedDemographics,
          parsedVariants,
          loadedData,
          completePhase
        );
        saveReport(report);
        dispatch({ type: "SET_REPORT", report });
      } catch (error) {
        console.error("Error processing demo file:", error);
        dispatch({ type: "SET_PHASE", phase: "upload" });
        dispatch({ type: "SET_PROGRESS", progress: undefined });
        alert("An error occurred while loading the demo. Please try again.");
      }
    }, 0); // Execute on next tick to allow UI to update
  };

  // Handle cancel processing
  const handleCancelProcessing = () => {
    dispatch({ type: "SET_PHASE", phase: "upload" });
    dispatch({ type: "SET_PROGRESS", progress: undefined });
  };

  // Handle back to upload
  const handleBackToUpload = () => {
    dispatch({ type: "SET_PHASE", phase: "upload" });
  };

  // Handle discuss mutation or PRS
  const handleDiscuss = (id: string) => {
    // Check if it's a PGS ID (starts with "PGS") or RSID
    if (id.startsWith("PGS")) {
      dispatch({ type: "SET_SELECTED_ITEM", item: { type: "prs", id } });
    } else {
      dispatch({ type: "SET_SELECTED_ITEM", item: { type: "mutation", id } });
      // Keep backward compatibility
      dispatch({ type: "SET_SELECTED_MUTATION", rsid: id });
    }
    dispatch({ type: "SET_CHAT_OPEN", open: true });
  };

  // Handle send message
  const handleSendMessage = (content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content,
      timestamp: new Date(),
      mutationContext:
        state.selectedMutationId && state.report
          ? {
              rsid: state.selectedMutationId,
              gene_name:
                state.report.mutations.find(
                  (m) => m.rsid === state.selectedMutationId
                )?.gene_name || "",
              phenotype:
                state.report.mutations.find(
                  (m) => m.rsid === state.selectedMutationId
                )?.phenotype || "",
            }
          : undefined,
    };

    dispatch({ type: "ADD_CHAT_MESSAGE", message: userMessage });

    // Mock assistant response
    setTimeout(
      () => {
        const mutation = state.report?.mutations.find(
          (m) => m.rsid === state.selectedMutationId
        );
        let assistantContent = "I understand you're asking about ";

        if (mutation) {
          assistantContent += `${mutation.rsid} in the ${mutation.gene_name} gene. `;

          if (content.toLowerCase().includes("risk")) {
            assistantContent += `This variant is associated with ${mutation.phenotype.toLowerCase()}. The evidence level is ${mutation.evidence_level}, which means ${
              mutation.evidence_level === "4 Stars"
                ? "there is strong scientific evidence"
                : mutation.evidence_level === "3 Stars"
                  ? "there is moderate scientific evidence"
                  : "there is preliminary evidence"
            } supporting this association.`;
          } else if (content.toLowerCase().includes("gene")) {
            assistantContent += `The ${mutation.gene_name} gene is located on chromosome ${mutation.chrom} at position ${mutation.position}. This variant involves a change from ${mutation.reference_allele} to ${mutation.alternative_allele}.`;
          } else if (content.toLowerCase().includes("evidence")) {
            assistantContent += `This variant has ${mutation.evidence_level} evidence level, indicating ${
              mutation.evidence_level === "4 Stars"
                ? "high confidence in the genetic association"
                : mutation.evidence_level === "3 Stars"
                  ? "moderate confidence in the genetic association"
                  : "preliminary evidence that requires further validation"
            }.`;
          } else {
            assistantContent += `This genetic variant is associated with ${mutation.phenotype.toLowerCase()}. It's located in the ${mutation.gene_name} gene and has ${mutation.evidence_level} evidence supporting its clinical significance.`;
          }
        } else {
          assistantContent +=
            "your genetic results. Please select a specific mutation from your report to get more detailed information.";
        }

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: assistantContent,
          timestamp: new Date(),
        };

        dispatch({ type: "ADD_CHAT_MESSAGE", message: assistantMessage });
      },
      1000 + Math.random() * 2000
    );
  };

  // Render current phase
  const renderCurrentPhase = () => {
    switch (state.phase) {
      case "upload":
        return (
          <UploadPage
            selectedFile={state.uploadedFile}
            demographics={state.demographics}
            onFileSelect={handleFileSelect}
            onDemographicsChange={handleDemographicsChange}
            onStart={handleStart}
            onDemo={handleDemo}
          />
        );

      case "processing":
        return (
          <ProcessingPage
            onCancel={handleCancelProcessing}
            fileName={state.uploadedFile?.name}
            progressInfo={state.progressInfo}
          />
        );

      case "report":
        return state.report ? (
          <ReportPage
            report={state.report}
            extendedDemographics={state.extendedDemographics}
            selectedMutationId={state.selectedMutationId}
            selectedItem={state.selectedItem}
            chatMessages={state.chatMessages}
            onDiscuss={handleDiscuss}
            onSendMessage={handleSendMessage}
            onExtendedDemographicsChange={handleExtendedDemographicsChange}
            onBack={handleBackToUpload}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* DNA Background */}
      <DNABackground />

      {/* Global disclaimer banner */}
      <div className="h-[37px]">
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-yellow-800">
                {DISCLAIMER_TOP}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10">{renderCurrentPhase()}</div>

      {/* Privacy Toast */}
      <PrivacyToast />

      {/* System Requirements Toast */}
      <SystemRequirementsToast />
    </div>
  );
}

// App provider component
function App() {
  const isMobile = useIsMobile();

  // Show mobile error screen if accessing from mobile device
  if (isMobile) {
    return <MobileErrorScreen />;
  }

  const initialState: AppState = {
    phase: "upload",
    demographics: getDemographics(),
    extendedDemographics: {},
    chatMessages: [],
    uiPreferences: {
      sectionsExpanded: {
        "4 Stars": true,
        "3 Stars": true,
        "1 Star": false,
        PRS: true,
      },
      chatOpen: false,
    },
  };

  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <AppContent />
    </AppContext.Provider>
  );
}

export default App;
