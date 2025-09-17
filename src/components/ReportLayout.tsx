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
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
              {mutation.rsid}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {mutation.gene_name}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {mutation.phenotype}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Chr {mutation.chrom}:{mutation.position} ({mutation.reference_allele}→
          {mutation.alternative_allele})
        </div>
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
  "4 Stars": {
    title: "Scientifically Supported",
    description:
      "High-confidence genetic associations with strong scientific evidence",
    color: "green",
  },
  "3 Stars": {
    title: "Moderate",
    description:
      "Moderate-confidence associations with substantial supporting evidence",
    color: "yellow",
  },
  "1 Star": {
    title: "Tentative",
    description: "Preliminary associations with limited or emerging evidence",
    color: "gray",
  },
} as const;

export default function ReportLayout({
  report,
  selectedMutationId,
  chatMessages,
  onDiscuss,
  onSendMessage,
}: ReportLayoutProps) {
  const [sectionsExpanded, setSectionsExpanded] = useState<
    Record<StarRating, boolean>
  >({
    "4 Stars": true,
    "3 Stars": true,
    "1 Star": false,
  });
  const [chatOpen, setChatOpen] = useState(false);

  // Load UI preferences
  useEffect(() => {
    const preferences = getUIPreferences();
    if (preferences.sectionsExpanded) {
      setSectionsExpanded(preferences.sectionsExpanded);
    }
    setChatOpen(preferences.chatOpen);
  }, []);

  // Save UI preferences when they change
  useEffect(() => {
    saveUIPreferences({ sectionsExpanded, chatOpen });
  }, [sectionsExpanded, chatOpen]);

  const toggleSection = (level: StarRating) => {
    setSectionsExpanded((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const selectedMutation = selectedMutationId
    ? report.mutations.find((m) => m.rsid === selectedMutationId)
    : undefined;

  // Group mutations by evidence level
  const mutationsByEvidence = report.mutations.reduce(
    (acc, mutation) => {
      if (!acc[mutation.evidence_level]) {
        acc[mutation.evidence_level] = [];
      }
      acc[mutation.evidence_level].push(mutation);
      return acc;
    },
    {} as Record<StarRating, Mutation[]>
  );

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Sections */}
          <div className="space-y-6">
            {(["4 Stars", "3 Stars", "1 Star"] as StarRating[]).map((level) => {
              const mutations = mutationsByEvidence[level] || [];
              if (mutations.length === 0) return null;

              const config = SECTION_CONFIG[level];

              return (
                <div key={level} className="space-y-4">
                  <button
                    onClick={() => toggleSection(level)}
                    className="flex items-center justify-between w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        {config.title} ({mutations.length})
                      </h2>
                      <p className="text-sm text-gray-600">
                        {config.description}
                      </p>
                    </div>
                    <svg
                      className={cn(
                        "w-6 h-6 transition-transform",
                        sectionsExpanded[level] && "rotate-180"
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

                  {sectionsExpanded[level] && (
                    <div className="grid gap-3">
                      {mutations.map((mutation) => (
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
              );
            })}
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
