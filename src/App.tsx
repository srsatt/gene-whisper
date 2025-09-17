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
} from "./models";
import { DISCLAIMER_TOP, ERR_UNSUPPORTED } from "./assets/copy";
import { getDemographics, saveDemographics, saveReport } from "./db";
import { formatAbsoluteRisk } from "./tools";
import UploadPage from "./pages/UploadPage";
import ProcessingPage from "./pages/ProcessingPage";
import ReportPage from "./pages/ReportPage";
import DNABackground from "./components/DNABackground";
import PrivacyToast from "./components/PrivacyToast";
import SystemRequirementsToast from "./components/SystemRequirementsToast";
import MobileErrorScreen from "./components/MobileErrorScreen";
import { useIsMobile } from "./utils/device";

// Mock report generator
async function generateReportMock(demographics: Demographics): Promise<Report> {
  // Simulate processing delay
  await new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 4000 + 8000)
  );

  const mockFindings: Finding[] = [
    // Evidence Level A findings
    {
      id: "eye-color",
      title: "Eye Color",
      summary:
        "Your genetic variants strongly predict brown eyes with high confidence.",
      rsIds: ["rs12913832", "rs1800407"],
      riskLevel: "Low",
      evidenceLevel: "A",
      baseRiskScore: 15,
      absoluteRisk: "Brown eyes (85% probability)",
      category: "trait",
      actions: [],
      whatIf: [],
      uncertaintyRange: [12, 18],
    },
    {
      id: "lactose-intolerance",
      title: "Lactose Intolerance",
      summary:
        "You have genetic variants associated with lactose persistence, suggesting you can digest dairy products into adulthood.",
      rsIds: ["rs4988235", "rs182549"],
      riskLevel: "Low",
      evidenceLevel: "A",
      baseRiskScore: 20,
      absoluteRisk: formatAbsoluteRisk(demographics.age),
      category: "trait",
      actions: [
        {
          id: "dairy-intake",
          title: "Monitor dairy intake",
          description:
            "While genetically you can process lactose, some people still experience symptoms.",
          evidenceLevel: "A",
          category: "lifestyle",
        },
      ],
      whatIf: [
        {
          id: "dairy-consumption",
          label: "Daily dairy servings",
          type: "slider",
          currentValue: 2,
          range: [0, 6],
          step: 1,
          unit: " servings",
        },
      ],
    },
    {
      id: "caffeine-sensitivity",
      title: "Caffeine Sensitivity",
      summary:
        "Your CYP1A2 variants suggest you are a fast caffeine metabolizer, meaning you can tolerate higher amounts of caffeine.",
      rsIds: ["rs762551", "rs2069514"],
      riskLevel: "Low",
      evidenceLevel: "A",
      baseRiskScore: 25,
      category: "trait",
      actions: [
        {
          id: "caffeine-timing",
          title: "Optimize caffeine timing",
          description:
            "Even fast metabolizers should avoid caffeine 6 hours before bedtime.",
          evidenceLevel: "A",
          category: "lifestyle",
        },
      ],
      whatIf: [
        {
          id: "daily-caffeine",
          label: "Daily caffeine intake",
          type: "slider",
          currentValue: 200,
          range: [0, 600],
          step: 50,
          unit: "mg",
        },
      ],
    },

    // Evidence Level B findings
    {
      id: "cad-risk",
      title: "Coronary Artery Disease Risk",
      summary:
        "Multiple genetic variants contribute to a moderately elevated risk for coronary artery disease.",
      rsIds: ["rs10757274", "rs2383206", "rs9982601"],
      riskLevel: "High",
      evidenceLevel: "B",
      baseRiskScore: 75,
      absoluteRisk: formatAbsoluteRisk(demographics.age),
      category: "disease",
      actions: [
        {
          id: "cardio-exercise",
          title: "Regular cardiovascular exercise",
          description:
            "Aim for 150 minutes of moderate aerobic activity per week.",
          evidenceLevel: "A",
          category: "lifestyle",
        },
        {
          id: "lipid-screening",
          title: "Regular lipid screening",
          description:
            "Check cholesterol levels annually or as recommended by your doctor.",
          evidenceLevel: "A",
          category: "screening",
        },
        {
          id: "mediterranean-diet",
          title: "Mediterranean-style diet",
          description:
            "Emphasize fruits, vegetables, whole grains, and healthy fats.",
          evidenceLevel: "A",
          category: "lifestyle",
        },
      ],
      whatIf: [
        {
          id: "smoking",
          label: "Current smoker",
          type: "toggle",
          currentValue: false,
        },
        {
          id: "exercise",
          label: "Regular exercise",
          type: "toggle",
          currentValue: true,
        },
        {
          id: "bmi",
          label: "BMI",
          type: "slider",
          currentValue: 25,
          range: [18, 35],
          step: 0.5,
          unit: "",
        },
      ],
      uncertaintyRange: [65, 85],
    },
    {
      id: "t2d-risk",
      title: "Type 2 Diabetes Risk",
      summary:
        "Your polygenic risk score suggests elevated susceptibility to type 2 diabetes.",
      rsIds: ["rs7903146", "rs12255372", "rs1801282"],
      riskLevel: "Moderate",
      evidenceLevel: "B",
      baseRiskScore: 60,
      absoluteRisk: formatAbsoluteRisk(demographics.age),
      category: "disease",
      actions: [
        {
          id: "glucose-screening",
          title: "Regular glucose screening",
          description: "Monitor HbA1c and fasting glucose levels annually.",
          evidenceLevel: "A",
          category: "screening",
        },
        {
          id: "weight-management",
          title: "Maintain healthy weight",
          description:
            "Even modest weight loss can significantly reduce diabetes risk.",
          evidenceLevel: "A",
          category: "lifestyle",
        },
      ],
      whatIf: [
        {
          id: "weight-loss",
          label: "Weight reduction",
          type: "slider",
          currentValue: 0,
          range: [0, 20],
          step: 2,
          unit: "kg",
        },
        {
          id: "sugar-intake",
          label: "High sugar diet",
          type: "toggle",
          currentValue: false,
        },
      ],
    },
    {
      id: "alcohol-flush",
      title: "Alcohol Flush Response",
      summary:
        "You have variants in ALDH2 that may cause facial flushing and discomfort when consuming alcohol.",
      rsIds: ["rs671"],
      riskLevel: "Moderate",
      evidenceLevel: "B",
      baseRiskScore: 45,
      category: "trait",
      actions: [
        {
          id: "limit-alcohol",
          title: "Moderate alcohol consumption",
          description:
            "Consider limiting alcohol intake to reduce uncomfortable symptoms.",
          evidenceLevel: "B",
          category: "lifestyle",
        },
      ],
      whatIf: [
        {
          id: "alcohol-frequency",
          label: "Drinks per week",
          type: "slider",
          currentValue: 2,
          range: [0, 14],
          step: 1,
          unit: " drinks",
        },
      ],
    },

    // Evidence Level C findings
    {
      id: "sleep-duration",
      title: "Sleep Duration Preference",
      summary:
        "Genetic variants suggest you may naturally prefer longer sleep duration.",
      rsIds: ["rs228697", "rs1556832"],
      riskLevel: "Low",
      evidenceLevel: "C",
      baseRiskScore: 30,
      category: "trait",
      actions: [
        {
          id: "sleep-hygiene",
          title: "Prioritize sleep hygiene",
          description:
            "Maintain consistent sleep schedule and aim for 7-9 hours per night.",
          evidenceLevel: "A",
          category: "lifestyle",
        },
      ],
      whatIf: [
        {
          id: "sleep-hours",
          label: "Nightly sleep duration",
          type: "slider",
          currentValue: 8,
          range: [5, 11],
          step: 0.5,
          unit: " hours",
        },
      ],
    },
    {
      id: "injury-risk",
      title: "Sports Injury Susceptibility",
      summary:
        "Preliminary evidence suggests variants that may affect connective tissue strength.",
      rsIds: ["rs1800012", "rs12722"],
      riskLevel: "Moderate",
      evidenceLevel: "C",
      baseRiskScore: 55,
      category: "trait",
      actions: [
        {
          id: "warm-up",
          title: "Proper warm-up routine",
          description:
            "Always warm up before exercise and cool down afterward.",
          evidenceLevel: "A",
          category: "lifestyle",
        },
        {
          id: "strength-training",
          title: "Include strength training",
          description:
            "Building muscle strength can help protect joints and connective tissue.",
          evidenceLevel: "B",
          category: "lifestyle",
        },
      ],
      whatIf: [
        {
          id: "exercise-intensity",
          label: "High-intensity exercise",
          type: "toggle",
          currentValue: true,
        },
      ],
    },
    {
      id: "vitamin-d",
      title: "Vitamin D Metabolism",
      summary:
        "Genetic variants may affect how efficiently you process vitamin D.",
      rsIds: ["rs2282679", "rs12785878"],
      riskLevel: "Low",
      evidenceLevel: "C",
      baseRiskScore: 35,
      category: "trait",
      actions: [
        {
          id: "vitamin-d-test",
          title: "Check vitamin D levels",
          description:
            "Consider annual testing, especially if you have limited sun exposure.",
          evidenceLevel: "B",
          category: "screening",
        },
        {
          id: "sun-exposure",
          title: "Moderate sun exposure",
          description:
            "Aim for 10-15 minutes of midday sun exposure several times per week.",
          evidenceLevel: "B",
          category: "lifestyle",
        },
      ],
      whatIf: [
        {
          id: "supplement-use",
          label: "Vitamin D supplement",
          type: "toggle",
          currentValue: false,
        },
      ],
    },
  ];

  return {
    id: `report-${Date.now()}`,
    vendor: "Generic VCF",
    quality: "High",
    generatedAt: new Date(),
    findings: mockFindings,
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
              rsIds:
                state.report.findings.find(
                  (f) => f.id === state.selectedFindingId
                )?.rsIds || [],
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
          assistantContent += `${finding.title}. Based on your genetic variants (${finding.rsIds.join(", ")}), `;

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
