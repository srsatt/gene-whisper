import { useState, useEffect } from "react";
import type {
  Report,
  Mutation,
  StarRating,
  ChatMessage,
  SelectedItem,
} from "../models";
import { saveUIPreferences, getUIPreferences } from "../db";
import ChatSidebar from "./ChatSidebar";
import { cn } from "../tools";
import type { PRSResult } from "../prs";

interface ReportLayoutProps {
  report: Report;
  selectedMutationId?: string;
  selectedItem?: SelectedItem;
  chatMessages: ChatMessage[];
  onDiscuss: (id: string) => void;
  onSendMessage: (content: string) => void;
  prsResults?: PRSResult[];
}

interface MutationCardProps {
  mutation: Mutation;
  onDiscuss: (id: string) => void;
  isSelected: boolean;
}

interface PRSCardProps {
  prsResult: PRSResult;
  onDiscuss: (id: string) => void;
}

function MutationCard({ mutation, onDiscuss, isSelected }: MutationCardProps) {
  // Render enhanced card if we have SnpData
  if (mutation.snpData && mutation.source === "snpedia") {
    return (
      <EnhancedMutationCard
        mutation={mutation}
        onDiscuss={onDiscuss}
        isSelected={isSelected}
      />
    );
  }

  // Fallback to original card for ClinVar data
  return (
    <div
      className={cn(
        "bg-white rounded-lg border p-4 transition-all group",
        isSelected
          ? "border-blue-500 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <a
              href={`https://www.snpedia.com/index.php/${mutation.rsid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono hover:bg-blue-100 hover:text-blue-700 transition-colors lowercase"
            >
              {mutation.rsid}
            </a>
            <span className="text-sm font-medium text-gray-900">
              {mutation.gene_name}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {mutation.phenotype}
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-center">
          <button
            onClick={() => onDiscuss(mutation.rsid)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Discuss
          </button>
        </div>
      </div>
    </div>
  );
}

function EnhancedMutationCard({
  mutation,
  onDiscuss,
  isSelected,
}: MutationCardProps) {
  const snpData = mutation.snpData!;

  // Extract links from templates (PMIDs with titles)
  const links: Array<{ pmid: string; title: string }> = [];
  const lists: string[] = [];

  if (snpData.sections) {
    for (const section of snpData.sections) {
      // Extract PMID links from templates
      if (section.templates) {
        for (const template of section.templates) {
          if (template.pmid && template.title) {
            links.push({ pmid: template.pmid, title: template.title });
          }
        }
      }

      // Extract list items
      if (section.lists) {
        for (const listGroup of section.lists) {
          for (const listItem of listGroup) {
            if (listItem.text) {
              lists.push(listItem.text);
            }
          }
        }
      }
    }
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg border p-4 transition-all group",
        isSelected
          ? "border-blue-500 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <a
              href={`https://www.snpedia.com/index.php/${mutation.rsid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono hover:bg-blue-100 hover:text-blue-700 transition-colors lowercase"
            >
              {mutation.rsid}
            </a>
            <span className="text-sm font-medium text-gray-900">
              {mutation.gene_name}
            </span>
          </div>

          {/* Description from paragraphs */}
          {mutation.phenotype && (
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              {mutation.phenotype}
            </p>
          )}

          {/* Links section */}
          {links.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                Research Papers:
              </h4>
              <div className="space-y-1">
                {links.slice(0, 2).map((link, index) => (
                  <a
                    key={index}
                    href={`https://pubmed.ncbi.nlm.nih.gov/${link.pmid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {link.title}
                  </a>
                ))}
                {links.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{links.length - 2} more papers
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Lists section */}
          {lists.length > 0 && (
            <div className="mb-2">
              <h4 className="text-xs font-medium text-gray-700 mb-1">
                Additional Info:
              </h4>
              <div className="text-xs text-gray-600">
                {lists.slice(0, 3).map((item, index) => (
                  <div key={index} className="truncate">
                    • {item}
                  </div>
                ))}
                {lists.length > 3 && (
                  <div className="text-gray-500">
                    +{lists.length - 3} more items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-center">
          <button
            onClick={() => onDiscuss(mutation.rsid)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Discuss
          </button>
        </div>
      </div>
    </div>
  );
}

function PRSCard({ prsResult, onDiscuss }: PRSCardProps) {
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
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-purple-200 p-4 hover:border-purple-300 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
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
              <a
                href={`https://www.pgscatalog.org/score/${prsResult.pgs_id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline font-mono"
              >
                {prsResult.pgs_id}
              </a>
            </div>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-center">
          <button
            onClick={() => onDiscuss(prsResult.pgs_id)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Discuss
          </button>
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
  selectedItem,
  chatMessages,
  onDiscuss,
  onSendMessage,
  prsResults = [],
}: ReportLayoutProps) {
  const [sectionExpanded, setSectionExpanded] = useState(true);
  const [prsSectionExpanded, setPrsSectionExpanded] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [showNormalRisk, setShowNormalRisk] = useState(false);

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
        setVisibleCount(20);
      }
      return !prev;
    });
  };

  const showMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  const toggleNormalRisk = () => {
    setShowNormalRisk((prev) => !prev);
  };

  const selectedMutation = selectedMutationId
    ? report.mutations.find((m) => m.rsid === selectedMutationId)
    : undefined;

  // Find selected item (mutation or PRS)
  const getSelectedItemData = () => {
    if (!selectedItem) return null;

    if (selectedItem.type === "mutation") {
      const mutation = report.mutations.find((m) => m.rsid === selectedItem.id);
      return mutation
        ? {
            type: "mutation" as const,
            data: mutation,
          }
        : null;
    } else if (selectedItem.type === "prs") {
      const prsResult = prsResults.find((p) => p.pgs_id === selectedItem.id);
      return prsResult
        ? {
            type: "prs" as const,
            data: prsResult,
          }
        : null;
    }

    return null;
  };

  const selectedItemData = getSelectedItemData();

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

  // Sort PRS results: high risk, low risk, normal risk
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
        case "low":
          return 2;
        case "normal":
          return 1;
        default:
          return 0;
      }
    };

    return getRiskValue(b.risk) - getRiskValue(a.risk);
  });

  // Filter PRS results: always show high/low risk, show normal only if toggled
  const highLowRiskResults = sortedPrsResults.filter((prs) => {
    if (typeof prs.risk === "number") return false; // Skip raw scores for now
    return prs.risk === "high" || prs.risk === "low";
  });

  const normalRiskResults = sortedPrsResults.filter((prs) => {
    if (typeof prs.risk === "number") return true; // Include raw scores with normal
    return prs.risk === "normal";
  });

  // Combine results based on toggle state
  const visiblePrsResults = showNormalRisk
    ? [...highLowRiskResults, ...normalRiskResults]
    : highLowRiskResults;

  const hasNormalRisk = normalRiskResults.length > 0;

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Sections */}
          <div className="space-y-8">
            {/* Polygenic Risk Score Section */}
            {prsResults.length > 0 && (
              <div>
                <button
                  onClick={togglePrsSection}
                  className={cn(
                    "flex items-center justify-between w-full text-left bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 p-6 hover:from-purple-100 hover:to-indigo-100 shadow-sm cursor-pointer",
                    prsSectionExpanded ? "rounded-t-lg" : "rounded-lg"
                  )}
                  style={{ outline: "none" }}
                >
                  <div>
                    <h2 className="text-xl font-bold text-purple-900 mb-2 flex items-center gap-2">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Polygenic Risk Score ({sortedPrsResults.length})
                    </h2>
                    <p className="text-sm text-purple-700">
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
                  <div>
                    <div className="bg-white rounded-b-lg border border-t-0 border-purple-100 p-4 shadow-sm">
                      <div className="grid gap-4">
                        {visiblePrsResults.map((prsResult) => (
                          <PRSCard
                            key={prsResult.pgs_id}
                            prsResult={prsResult}
                            onDiscuss={onDiscuss}
                          />
                        ))}
                      </div>
                    </div>

                    {hasNormalRisk && (
                      <div className="flex justify-center pt-6">
                        <button
                          onClick={toggleNormalRisk}
                          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          {showNormalRisk
                            ? `Collapse (${normalRiskResults.length} Normal Risk)`
                            : `Expand (${normalRiskResults.length} Normal Risk)`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Monogenic Score Section */}
            {allMutations.length > 0 && (
              <div className="">
                <button
                  onClick={toggleSection}
                  className={cn(
                    "flex items-center justify-between w-full text-left bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 p-6 hover:from-purple-100 hover:to-indigo-100 shadow-sm cursor-pointer",
                    sectionExpanded ? "rounded-t-lg" : "rounded-lg"
                  )}
                  style={{ outline: "none" }}
                >
                  <div>
                    <h2 className="text-xl font-bold text-purple-900 mb-2 flex items-center gap-2">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                      {SECTION_CONFIG.title} ({allMutations.length})
                    </h2>
                    <p className="text-sm text-purple-700">
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
                  <div>
                    <div className="bg-white rounded-b-lg border border-t-0 border-purple-100 p-4 shadow-sm">
                      <div className="grid gap-4">
                        {visibleMutations.map((mutation) => (
                          <MutationCard
                            key={mutation.rsid}
                            mutation={mutation}
                            onDiscuss={onDiscuss}
                            isSelected={mutation.rsid === selectedMutationId}
                          />
                        ))}
                      </div>
                    </div>

                    {hasMore && (
                      <div className="flex justify-center pt-6">
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
        selectedItem={selectedItemData}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
