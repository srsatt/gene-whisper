import React, { createContext, useContext, useReducer } from "react";
import type {
  AppState,
  Demographics,
  Report,
  ChatMessage,
  StarRating,
  SelectedItem,
} from "./models";
import { DISCLAIMER_TOP, ERR_UNSUPPORTED } from "./assets/copy";
import { getDemographics, saveDemographics, saveReport } from "./db";
import {
  parseGenomeFile,
  loadClinvarDatabase,
  loadSnpediaDatabase,
  findSharedVariants,
  convertToMutations,
} from "./variant_tools";
import { calculateAllPrs, type PRSResult } from "./prs";
import UploadPage from "./pages/UploadPage";
import ProcessingPage from "./pages/ProcessingPage";
import ReportPage from "./pages/ReportPage";
import DNABackground from "./components/DNABackground";
import PrivacyToast from "./components/PrivacyToast";
import SystemRequirementsToast from "./components/SystemRequirementsToast";
import MobileErrorScreen from "./components/MobileErrorScreen";
import { useIsMobile } from "./utils/device";

// Load PRS data files
async function loadPRSData() {
  console.log("Loading PRS data files...");

  const [configResponse, indexResponse, weightsResponse] = await Promise.all([
    fetch("/data_files/prs_config.json"),
    fetch("/data_files/prs_23andme_index_map.json"),
    fetch("/data_files/prs_weights.json"),
  ]);

  if (!configResponse.ok || !indexResponse.ok || !weightsResponse.ok) {
    throw new Error("Failed to load PRS data files");
  }

  const [prsConfigs, indexMap, allWeights] = await Promise.all([
    configResponse.json(),
    indexResponse.json(),
    weightsResponse.json(),
  ]);

  console.log(`Loaded ${prsConfigs.length} PRS configurations`);
  console.log(`Loaded index map with ${Object.keys(indexMap).length} variants`);
  console.log(`Loaded weights for ${allWeights.length} PRS models`);

  return { prsConfigs, indexMap, allWeights };
}

// Real report generator using genetic analysis results
async function generateRealReport(
  sharedVariants: any[],
  demographics: Demographics,
  parsedVariants: Record<string, any>
): Promise<Report> {
  // Convert shared variants to mutations format
  const mutations = convertToMutations(sharedVariants);

  const clinvarCount = sharedVariants.filter(
    (v) => v.source === "clinvar"
  ).length;
  const snpediaCount = sharedVariants.filter(
    (v) => v.source === "snpedia"
  ).length;

  console.log(
    `Generated report with ${mutations.length} clinically significant mutations`
  );
  console.log(`  - From ${clinvarCount} ClinVar variants (medical conditions)`);
  console.log(`  - From ${snpediaCount} SNPedia variants (genetic traits)`);

  // Calculate PRS scores
  let prsResults: PRSResult[] = [];
  try {
    const { prsConfigs, indexMap, allWeights } = await loadPRSData();
    prsResults = calculateAllPrs(
      parsedVariants,
      indexMap,
      prsConfigs,
      allWeights
    );
    console.log(`Calculated ${prsResults.length} PRS scores`);
  } catch (error) {
    console.error("Failed to calculate PRS scores:", error);
    // Continue without PRS scores
  }

  return {
    id: `report-${Date.now()}`,
    vendor: "23andMe", // Could be detected from file format
    generatedAt: new Date(),
    mutations,
    demographics,
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
  | { type: "SET_REPORT"; report: Report }
  | { type: "SET_SELECTED_MUTATION"; rsid?: string }
  | { type: "SET_SELECTED_ITEM"; item?: SelectedItem }
  | { type: "ADD_CHAT_MESSAGE"; message: ChatMessage }
  | { type: "TOGGLE_SECTION_EXPANDED"; level: StarRating }
  | { type: "SET_CHAT_OPEN"; open: boolean };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, phase: action.phase };

    case "SET_FILE":
      return { ...state, uploadedFile: action.file };

    case "SET_DEMOGRAPHICS":
      return { ...state, demographics: action.demographics };

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
function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// Online status component
function OnlineStatus() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center space-x-1">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? "bg-green-500" : "bg-red-500"
        }`}
        aria-hidden="true"
      />
      <span className="text-xs font-medium text-yellow-800">
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
}

// Main App component
function AppContent() {
  const { state, dispatch } = useAppContext();

  // File validation
  const validateFile = (file: File): boolean => {
    const validExtensions = [".txt", ".vcf"];
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

  // Handle start processing
  const handleStart = async () => {
    if (!state.uploadedFile) return;

    dispatch({ type: "SET_PHASE", phase: "processing" });

    try {
      // Read and parse the uploaded file
      const fileContent = await state.uploadedFile.text();
      const parsedVariants = parseGenomeFile(fileContent);

      console.log(
        `Parsed ${Object.keys(parsedVariants).length} variants from file`
      );

      // Load database files
      console.log("Loading ClinVar and SNPedia databases...");
      const [clinvarMap, snpediaMap] = await Promise.all([
        loadClinvarDatabase(),
        loadSnpediaDatabase(),
      ]);

      console.log(`Loaded ${Object.keys(clinvarMap).length} ClinVar variants`);
      console.log(`Loaded ${Object.keys(snpediaMap).length} SNPedia variants`);

      // Find shared variants between user genome and databases
      const sharedVariants = findSharedVariants(
        parsedVariants,
        clinvarMap,
        snpediaMap
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
        parsedVariants
      );
      saveReport(report);
      dispatch({ type: "SET_REPORT", report });
    } catch (error) {
      console.error("Error generating report:", error);
      dispatch({ type: "SET_PHASE", phase: "upload" });
      alert("An error occurred while processing your file. Please try again.");
    }
  };

  // Handle demo processing
  const handleDemo = async () => {
    try {
      // Fetch the demo file from public directory
      const response = await fetch("/demo_genome.txt");
      if (!response.ok) {
        throw new Error("Failed to load demo file");
      }

      const fileContent = await response.text();
      const demoFile = new File([fileContent], "demo_genome.txt", {
        type: "text/plain",
      });

      // Set the demo file and start processing
      dispatch({ type: "SET_FILE", file: demoFile });
      dispatch({ type: "SET_PHASE", phase: "processing" });

      // Parse the demo file content
      const parsedVariants = parseGenomeFile(fileContent);
      console.log(
        `Parsed ${Object.keys(parsedVariants).length} variants from demo file`
      );

      // Load database files
      console.log("Loading ClinVar and SNPedia databases...");
      const [clinvarMap, snpediaMap] = await Promise.all([
        loadClinvarDatabase(),
        loadSnpediaDatabase(),
      ]);

      console.log(`Loaded ${Object.keys(clinvarMap).length} ClinVar variants`);
      console.log(`Loaded ${Object.keys(snpediaMap).length} SNPedia variants`);

      // Find shared variants between user genome and databases
      const sharedVariants = findSharedVariants(
        parsedVariants,
        clinvarMap,
        snpediaMap
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
        parsedVariants
      );
      saveReport(report);
      dispatch({ type: "SET_REPORT", report });
    } catch (error) {
      console.error("Error processing demo file:", error);
      alert("An error occurred while loading the demo. Please try again.");
    }
  };

  // Handle cancel processing
  const handleCancelProcessing = () => {
    dispatch({ type: "SET_PHASE", phase: "upload" });
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
          />
        );

      case "report":
        return state.report ? (
          <ReportPage
            report={state.report}
            selectedMutationId={state.selectedMutationId}
            selectedItem={state.selectedItem}
            chatMessages={state.chatMessages}
            onDiscuss={handleDiscuss}
            onSendMessage={handleSendMessage}
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
            <div className="flex items-center">
              <OnlineStatus />
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
