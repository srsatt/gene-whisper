import { useState, useEffect } from "react";
import type { Report, Mutation, StarRating, ChatMessage } from "../models";
import { saveUIPreferences, getUIPreferences } from "../db";
import ChatSidebar from "./ChatSidebar";
import { cn } from "../tools";
import type { PRSResult } from "../prs";

interface ReportLayoutProps {
  report: Report;
  selectedMutationId?: string;
  chatMessages: ChatMessage[];
  onDiscuss: (rsid: string) => void;
  onSendMessage: (content: string) => void;
  prsResults?: PRSResult[];
}

interface MutationCardProps {
  mutation: Mutation;
  onDiscuss: (rsid: string) => void;
  isSelected: boolean;
}

interface PRSCardProps {
  prsResult: PRSResult;
}

function MutationCard({ mutation, onDiscuss, isSelected }: MutationCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border p-4 transition-all",
        isSelected
          ? "border-blue-500 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <a
              href={`https://www.snpedia.com/index.php/${mutation.rsid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              {mutation.rsid}
            </a>
            <span className="text-sm font-medium text-gray-900">
              {mutation.gene_name}
            </span>
            <span
              className={cn(
                "px-2 py-1 text-xs rounded font-medium",
                mutation.evidence_level === "4 Stars"
                  ? "bg-green-100 text-green-800"
                  : mutation.evidence_level === "3 Stars"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-700"
              )}
            >
              {mutation.evidence_level === "4 Stars"
                ? "Scientifically Proven"
                : mutation.evidence_level === "3 Stars"
                  ? "Moderate"
                  : "Tentative"}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {mutation.phenotype}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => onDiscuss(mutation.rsid)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Discuss
        </button>
      </div>
    </div>
  );
}

function PRSCard({ prsResult }: PRSCardProps) {
  const getRiskColor = (risk: PRSResult["risk"]) => {
    if (typeof risk === "number") {
      return "bg-gray-100 text-gray-700"; // For raw scores without risk categories
    }

    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRiskLabel = (risk: PRSResult["risk"]) => {
    if (typeof risk === "number") {
      return `Score: ${risk.toFixed(3)}`;
    }

    switch (risk) {
      case "low":
        return "Low Risk";
      case "normal":
        return "Normal Risk";
      case "high":
        return "High Risk";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-900">
              {prsResult.name}
            </span>
            <span
              className={cn(
                "px-2 py-1 text-xs rounded font-medium",
                getRiskColor(prsResult.risk)
              )}
            >
              {getRiskLabel(prsResult.risk)}
            </span>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              PGS ID:{" "}
              <a
                href={`https://www.pgscatalog.org/score/${prsResult.pgs_id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline font-mono"
              >
                {prsResult.pgs_id}
              </a>
            </div>
            <div>Raw Score: {prsResult.score.toFixed(3)}</div>
            {prsResult.sex !== "both" && (
              <div>Target: {prsResult.sex === "male" ? "Male" : "Female"}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SECTION_CONFIG = {
  title: "Monogenic Risk Score",
  description:
    "Single-gene variants with clinical significance and associated health conditions",
  color: "blue",
} as const;

export default function ReportLayout({
  report,
  selectedMutationId,
  chatMessages,
  onDiscuss,
  onSendMessage,
  prsResults = [],
}: ReportLayoutProps) {
  const [sectionExpanded, setSectionExpanded] = useState(true);
  const [prsSectionExpanded, setPrsSectionExpanded] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [prsVisibleCount, setPrsVisibleCount] = useState(10);

  // Load UI preferences
  useEffect(() => {
    const preferences = getUIPreferences();
    if (
      preferences.sectionsExpanded &&
      preferences.sectionsExpanded["4 Stars"] !== undefined
    ) {
      // Use the "4 Stars" section state as the default for the single section
      setSectionExpanded(preferences.sectionsExpanded["4 Stars"]);
    }
    if (
      preferences.sectionsExpanded &&
      preferences.sectionsExpanded["PRS"] !== undefined
    ) {
      setPrsSectionExpanded(preferences.sectionsExpanded["PRS"]);
    }
    setChatOpen(preferences.chatOpen);
  }, []);

  // Save UI preferences when they change
  useEffect(() => {
    saveUIPreferences({
      sectionsExpanded: {
        "4 Stars": sectionExpanded,
        "3 Stars": sectionExpanded,
        "1 Star": sectionExpanded,
        PRS: prsSectionExpanded,
      },
      chatOpen,
    });
  }, [sectionExpanded, prsSectionExpanded, chatOpen]);

  const toggleSection = () => {
    setSectionExpanded((prev) => {
      // Reset visible count when expanding section
      if (!prev) {
        setVisibleCount(20);
      }
      return !prev;
    });
  };

  const togglePrsSection = () => {
    setPrsSectionExpanded((prev) => {
      // Reset visible count when expanding section
      if (!prev) {
        setPrsVisibleCount(10);
      }
      return !prev;
    });
  };

  const showMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const showMorePrs = () => {
    setPrsVisibleCount((prev) => prev + 10);
  };

  const selectedMutation = selectedMutationId
    ? report.mutations.find((m) => m.rsid === selectedMutationId)
    : undefined;

  // All mutations sorted by evidence level (4 Stars -> 3 Stars -> 1 Star)
  const allMutations = report.mutations.sort((a, b) => {
    const evidenceOrder: Record<StarRating, number> = {
      "4 Stars": 0,
      "3 Stars": 1,
      "1 Star": 2,
    };
    return evidenceOrder[a.evidence_level] - evidenceOrder[b.evidence_level];
  });

  // Get visible mutations based on pagination
  const visibleMutations = allMutations.slice(0, visibleCount);
  const hasMore = visibleCount < allMutations.length;

  // Sort PRS results from high risk to low risk
  const sortedPrsResults = [...prsResults].sort((a, b) => {
    // Helper function to get numeric risk value for sorting
    const getRiskValue = (risk: PRSResult["risk"]) => {
      if (typeof risk === "number") {
        // For raw scores, we can't determine risk level, so put them at the end
        return -1000; // Low priority
      }
      switch (risk) {
        case "high":
          return 3;
        case "normal":
          return 2;
        case "low":
          return 1;
        default:
          return 0;
      }
    };

    return getRiskValue(b.risk) - getRiskValue(a.risk);
  });

  // Get visible PRS results based on pagination
  const visiblePrsResults = sortedPrsResults.slice(0, prsVisibleCount);
  const hasMorePrs = prsVisibleCount < sortedPrsResults.length;

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Sections */}
          <div className="space-y-6">
            {/* Polygenic Risk Score Section */}
            {prsResults.length > 0 && (
              <div className="space-y-4">
                <button
                  onClick={togglePrsSection}
                  className="flex items-center justify-between w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      Polygenic Risk Score ({sortedPrsResults.length})
                    </h2>
                    <p className="text-sm text-gray-600">
                      Multi-variant genetic risk assessments for complex traits
                      and diseases
                    </p>
                  </div>
                  <svg
                    className={cn(
                      "w-6 h-6 transition-transform",
                      prsSectionExpanded && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {prsSectionExpanded && (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {visiblePrsResults.map((prsResult) => (
                        <PRSCard key={prsResult.pgs_id} prsResult={prsResult} />
                      ))}
                    </div>

                    {hasMorePrs && (
                      <div className="flex justify-center pt-4">
                        <button
                          onClick={showMorePrs}
                          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          Show More ({sortedPrsResults.length - prsVisibleCount}{" "}
                          remaining)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Monogenic Score Section */}
            {allMutations.length > 0 && (
              <div className="space-y-4">
                <button
                  onClick={toggleSection}
                  className="flex items-center justify-between w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {SECTION_CONFIG.title} ({allMutations.length})
                    </h2>
                    <p className="text-sm text-gray-600">
                      {SECTION_CONFIG.description}
                    </p>
                  </div>
                  <svg
                    className={cn(
                      "w-6 h-6 transition-transform",
                      sectionExpanded && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {sectionExpanded && (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {visibleMutations.map((mutation) => (
                        <MutationCard
                          key={mutation.rsid}
                          mutation={mutation}
                          onDiscuss={onDiscuss}
                          isSelected={mutation.rsid === selectedMutationId}
                        />
                      ))}
                    </div>

                    {hasMore && (
                      <div className="flex justify-center pt-4">
                        <button
                          onClick={showMore}
                          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          Show More ({allMutations.length - visibleCount}{" "}
                          remaining)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      <ChatSidebar
        messages={chatMessages}
        selectedMutation={selectedMutation}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
