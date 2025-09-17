// src/App.tsx

import React, { createContext, useContext, useReducer, useEffect } from "react";
import type {
  AppState,
  Vendor,
  Demographics,
  Report,
  ChatMessage,
  Finding,
  Action,
  WhatIf,
  EvidenceLevel,
  RiskLevel,
  ClinvarEvidenceLevel,
  SimpleVariant,
} from "./models";
import { DISCLAIMER_TOP, ERR_UNSUPPORTED } from "./assets/copy";
import { getDemographics, saveDemographics, saveReport } from "./db";
import { formatAbsoluteRisk } from "./tools";
import UploadPage from "./pages/UploadPage";
import ProcessingPage from "./pages/ProcessingPage";
import ReportPage from "./pages/ReportPage";
import DNABackground from "./components/DNABackground";
import PrivacyToast from "./components/PrivacyToast";
// variantsData will be fetched from public/mutation_list.json
import SystemRequirementsToast from "./components/SystemRequirementsToast";
import MobileErrorScreen from "./components/MobileErrorScreen";
import { useIsMobile } from "./utils/device";

// Mock report generator using mutation_list.json
async function generateReportMock(demographics: Demographics): Promise<Report> {
  // Simulate processing delay
  await new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 4000 + 8000)
  );

  // Fetch variants data from public directory
  const response = await fetch("/mutation_list.json");
  const variantsData: SimpleVariant[] = await response.json();

  // Group variants by phenotype to create findings
  const variantsByPhenotype = variantsData.reduce(
    (acc: Record<string, SimpleVariant[]>, variant: SimpleVariant) => {
      const key = variant.phenotype;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(variant);
      return acc;
    },
    {} as Record<string, SimpleVariant[]>
  );

  // Create findings from grouped variants
  const findings: Finding[] = Object.entries(variantsByPhenotype).map(
    ([phenotype, variants]: [string, SimpleVariant[]], index: number) => {
      // Determine the overall evidence level based on the highest star rating
      const maxStarRating = variants.reduce((max, variant) => {
        const starNum = parseInt(variant.evidence_level);
        const maxNum = parseInt(max);
        return starNum > maxNum ? variant.evidence_level : max;
      }, "1 Star");

      // Map star rating to evidence level
      const evidenceLevel: EvidenceLevel =
        maxStarRating === "4 Stars"
          ? "A"
          : maxStarRating === "3 Stars"
            ? "B"
            : "C";

      // Create a simple risk assessment based on evidence level and phenotype
      const isHighRisk =
        phenotype.toLowerCase().includes("cancer") ||
        phenotype.toLowerCase().includes("disease") ||
        phenotype.toLowerCase().includes("diabetes");

      const riskLevel: RiskLevel = isHighRisk
        ? "High"
        : evidenceLevel === "A"
          ? "Moderate"
          : "Low";

      const baseRiskScore =
        riskLevel === "High"
          ? 70 + Math.random() * 20
          : riskLevel === "Moderate"
            ? 40 + Math.random() * 30
            : 10 + Math.random() * 30;

      return {
        id: `finding-${index}`,
        title: phenotype.charAt(0).toUpperCase() + phenotype.slice(1),
        summary: `Genetic analysis of ${variants.length} variant${variants.length > 1 ? "s" : ""} in ${variants.map((v) => v.gene_name).join(", ")} related to ${phenotype.toLowerCase()}.`,
        variants: variants.map((v) => ({
          rsid: v.rsid,
          evidence_level: v.evidence_level as ClinvarEvidenceLevel,
          gene_name: v.gene_name,
          phenotype: v.phenotype,
          chrom: v.chrom,
          position: v.position,
          reference_allele: v.reference_allele,
          alternative_allele: v.alternative_allele,
        })),
        riskLevel,
        evidenceLevel,
        baseRiskScore: Math.round(baseRiskScore),
        absoluteRisk:
          isHighRisk && demographics.age
            ? formatAbsoluteRisk(demographics.age)
            : undefined,
        category: isHighRisk ? "disease" : "trait",
        actions: [], // Simplified - no actions for now
        whatIf: [], // Simplified - no what-if scenarios for now
        uncertaintyRange:
          evidenceLevel === "A"
            ? [baseRiskScore - 5, baseRiskScore + 5]
            : evidenceLevel === "B"
              ? [baseRiskScore - 10, baseRiskScore + 10]
              : [baseRiskScore - 15, baseRiskScore + 15],
      };
    }
  );

  return {
    id: `report-${Date.now()}`,
    vendor: "Generic VCF",
    quality: "High",
    generatedAt: new Date(),
    findings,
    demographics,
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
  | { type: "SET_SELECTED_FINDING"; findingId?: string }
  | { type: "ADD_CHAT_MESSAGE"; message: ChatMessage }
  | { type: "TOGGLE_EVIDENCE_EXPANDED"; level: "A" | "B" | "C" }
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

    case "SET_SELECTED_FINDING":
      return { ...state, selectedFindingId: action.findingId };

    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.message],
      };

    case "TOGGLE_EVIDENCE_EXPANDED":
      return {
        ...state,
        uiPreferences: {
          ...state.uiPreferences,
          evidenceExpanded: {
            ...state.uiPreferences.evidenceExpanded,
            [action.level]: !state.uiPreferences.evidenceExpanded[action.level],
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
      const report = await generateReportMock(state.demographics);
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

      const report = await generateReportMock(state.demographics);
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

  // Handle discuss finding
  const handleDiscuss = (findingId: string) => {
    dispatch({ type: "SET_SELECTED_FINDING", findingId });
    dispatch({ type: "SET_CHAT_OPEN", open: true });
  };

  // Handle send message
  const handleSendMessage = (content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content,
      timestamp: new Date(),
      findingContext:
        state.selectedFindingId && state.report
          ? {
              findingId: state.selectedFindingId,
              title:
                state.report.findings.find(
                  (f) => f.id === state.selectedFindingId
                )?.title || "",
              riskLevel:
                state.report.findings.find(
                  (f) => f.id === state.selectedFindingId
                )?.riskLevel || "Low",
              variants:
                state.report.findings.find(
                  (f) => f.id === state.selectedFindingId
                )?.variants || [],
            }
          : undefined,
    };

    dispatch({ type: "ADD_CHAT_MESSAGE", message: userMessage });

    // Mock assistant response
    setTimeout(
      () => {
        const finding = state.report?.findings.find(
          (f) => f.id === state.selectedFindingId
        );
        let assistantContent = "I understand you're asking about ";

        if (finding) {
          assistantContent += `${finding.title}. Based on your genetic variants (${finding.variants.map((v) => v.rsid).join(", ")}), `;

          if (content.toLowerCase().includes("risk")) {
            assistantContent += `your current risk level is ${finding.riskLevel.toLowerCase()}. This means ${
              finding.riskLevel === "High"
                ? "you have elevated genetic predisposition"
                : finding.riskLevel === "Moderate"
                  ? "you have some genetic predisposition"
                  : "you have lower genetic predisposition"
            } compared to the average population.`;
          } else if (content.toLowerCase().includes("action")) {
            assistantContent += `the most evidence-based actions include: ${finding.actions
              .slice(0, 2)
              .map((a) => a.title.toLowerCase())
              .join(
                " and "
              )}. These recommendations have ${finding.actions[0]?.evidenceLevel === "A" ? "strong" : "moderate"} scientific support.`;
          } else if (content.toLowerCase().includes("population")) {
            assistantContent += `this affects approximately ${Math.round(finding.baseRiskScore)}% of people with similar genetic profiles. Your specific risk may vary based on lifestyle and environmental factors.`;
          } else {
            assistantContent += `this finding has ${finding.evidenceLevel === "A" ? "strong" : finding.evidenceLevel === "B" ? "moderate" : "preliminary"} scientific evidence. The key factors that influence this trait include your specific genetic variants and potentially modifiable lifestyle factors.`;
          }
        } else {
          assistantContent +=
            "your genetic results. Please select a specific finding from your report to get more detailed information.";
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
            selectedFindingId={state.selectedFindingId}
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
      evidenceExpanded: { A: true, B: false, C: false },
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
