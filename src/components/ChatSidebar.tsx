// src/components/ChatSidebar.tsx

import { useMemo, useEffect, useCallback } from "react";
import { createNanoEvents } from "nanoevents";
import type { ChatMessage, Mutation } from "../models";
import type { PRSResult } from "../prs";
import { CHAT_HEADER, PROMPTS } from "../assets/copy";
import { cn } from "../tools";
import { AssistantThreadWithTools } from "./AssistantThreadWithTools";

interface ChatSidebarProps {
  messages?: ChatMessage[]; // Made optional since we're not using it anymore
  selectedMutation?: Mutation;
  selectedItem?:
    | { type: "mutation"; data: Mutation }
    | { type: "prs"; data: PRSResult }
    | null;
  onSendMessage?: (content: string) => void; // Made optional since we're not using it anymore
  onClose?: () => void;
}

// Define common context interface
interface GeneticContext {
  type: "mutation" | "prs";
  name: string;
  id: string;
  data: string; // JSON stringified data
}

// Define the events interface for context messaging
interface ContextEvents {
  'context-message': (data: {
    message: string;
    context?: {
      type: "mutation" | "prs";
      data: Mutation | PRSResult;
    };
  }) => void;
  'set-context': (context: GeneticContext | null) => void;
}

export default function ChatSidebar({
  selectedMutation,
  selectedItem,
  onClose,
}: ChatSidebarProps) {
  // Create event emitter for context-aware messaging
  const eventEmitter = useMemo(() => createNanoEvents<ContextEvents>(), []);

  // Helper function to create context from selected item
  const createGeneticContext = useCallback((item: { type: "mutation"; data: Mutation } | { type: "prs"; data: PRSResult } | null): GeneticContext | null => {
    if (!item) return null;

    if (item.type === "mutation") {
      const mutation = item.data;
      return {
        type: "mutation",
        name: `${mutation.rsid} (${mutation.gene_name})`,
        id: mutation.rsid,
        data: JSON.stringify({
          rsid: mutation.rsid,
          gene_name: mutation.gene_name,
          phenotype: mutation.phenotype,
          evidence_level: mutation.evidence_level,
          genotype: mutation.genotype,
          genotype_comment: "  /** * The user's genotype code.\n" +
              "   * 1: Heterozygous (one copy of the alternative allele)\n" +
              "   * 2: Homozygous (two copies of the alternative allele)\n" +
              "   */"+
              "  /** * The user's genotype code. Use is to explain user mutations\n",

          chrom: mutation.chrom,
          position: mutation.position,
          reference_allele: mutation.reference_allele,
          alternative_allele: mutation.alternative_allele,
          source: mutation.source
        })
      };
    } else {
      const prs = item.data;
      return {
        type: "prs",
        name: prs.name,
        id: prs.name,
        data: JSON.stringify({
          name: prs.name,
          score: prs.score,
          risk: prs.risk,
          lower_cutoff: prs.lower_cutoff,
          upper_cutoff: prs.upper_cutoff,
          lower_is_better: prs.lower_is_better
        })
      };
    }
  }, []);

  // Set context when selected item changes
  useEffect(() => {
    const currentItem = selectedItem || (selectedMutation ? { type: "mutation" as const, data: selectedMutation } : null);
    const context = createGeneticContext(currentItem);

    console.log("🔍 Debug - Setting context:", context);
    eventEmitter.emit('set-context', context);
  }, [selectedItem, selectedMutation, eventEmitter, createGeneticContext]);

  const handlePromptClick = (prompt: string) => {
    // Send only the prompt message - context is handled by system prompt
    console.log("🔍 Debug - Emitting prompt:", prompt);
    eventEmitter.emit('context-message', {
      message: prompt
    });
  };

  const content = (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {CHAT_HEADER}
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Close</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Context chips */}
        {selectedMutation && (
          <div className="mt-2 flex flex-wrap gap-1">
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-mono bg-blue-100 text-blue-800">
              {selectedMutation.rsid}
            </div>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {selectedMutation.gene_name}
            </div>
            <div
              className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                selectedMutation.evidence_level === "4 Stars"
                  ? "bg-green-100 text-green-800"
                  : selectedMutation.evidence_level === "3 Stars"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-700"
              )}
            >
              {selectedMutation.evidence_level}
            </div>
          </div>
        )}
      </div>

      {/* Assistant Thread */}
      <div className="flex-1 overflow-hidden">
        <AssistantThreadWithTools eventEmitter={eventEmitter} />
      </div>

      {/* Suggested prompts */}
      {selectedMutation && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-gray-100">
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Suggested questions:</p>
            <div className="flex flex-wrap gap-1">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-100">
      <div className="fixed top-0 pt-[110px] bg-white right-0 bottom-0 w-100 border-l border-gray-200 h-full">
        {content}{" "}
      </div>
    </div>
  );
}
