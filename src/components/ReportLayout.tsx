import { useState, useEffect } from "react";
import type { Report, Mutation, StarRating, ChatMessage } from "../models";
import { saveUIPreferences, getUIPreferences } from "../db";
import ChatSidebar from "./ChatSidebar";
import { cn } from "../tools";

interface ReportLayoutProps {
  report: Report;
  selectedMutationId?: string;
  chatMessages: ChatMessage[];
  onDiscuss: (rsid: string) => void;
  onSendMessage: (content: string) => void;
}

interface MutationCardProps {
  mutation: Mutation;
  onDiscuss: (rsid: string) => void;
  isSelected: boolean;
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

const SECTION_CONFIG = {
  title: "Mono",
  description: "All genetic variants and associated traits from your analysis",
  color: "blue",
} as const;

export default function ReportLayout({
  report,
  selectedMutationId,
  chatMessages,
  onDiscuss,
  onSendMessage,
}: ReportLayoutProps) {
  const [sectionExpanded, setSectionExpanded] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

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
    setChatOpen(preferences.chatOpen);
  }, []);

  // Save UI preferences when they change
  useEffect(() => {
    saveUIPreferences({
      sectionsExpanded: {
        "4 Stars": sectionExpanded,
        "3 Stars": sectionExpanded,
        "1 Star": sectionExpanded,
      },
      chatOpen,
    });
  }, [sectionExpanded, chatOpen]);

  const toggleSection = () => {
    setSectionExpanded((prev) => !prev);
  };

  const selectedMutation = selectedMutationId
    ? report.mutations.find((m) => m.rsid === selectedMutationId)
    : undefined;

  // All mutations sorted by evidence level (4 Stars -> 3 Stars -> 1 Star)
  const allMutations = report.mutations.sort((a, b) => {
    const evidenceOrder: Record<StarRating, number> = { "4 Stars": 0, "3 Stars": 1, "1 Star": 2 };
    return evidenceOrder[a.evidence_level] - evidenceOrder[b.evidence_level];
  });

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Single Section */}
          <div className="space-y-6">
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
                  <div className="grid gap-3">
                    {allMutations.map((mutation) => (
                      <MutationCard
                        key={mutation.rsid}
                        mutation={mutation}
                        onDiscuss={onDiscuss}
                        isSelected={mutation.rsid === selectedMutationId}
                      />
                    ))}
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
