// src/components/ChatSidebar.tsx

import React, { useState, useRef, useEffect } from "react";
import type { ChatMessage, Mutation } from "../models";
import type { PRSResult } from "../prs";
import { CHAT_HEADER, PROMPTS } from "../assets/copy";
import { cn } from "../tools";

interface ChatSidebarProps {
  messages: ChatMessage[];
  selectedMutation?: Mutation;
  selectedItem?:
    | { type: "mutation"; data: Mutation }
    | { type: "prs"; data: PRSResult }
    | null;
  onSendMessage: (content: string) => void;
  onClose?: () => void;
}

export default function ChatSidebar({
  messages,
  selectedMutation,
  selectedItem,
  onSendMessage,
  onClose,
}: ChatSidebarProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handlePromptClick = (prompt: string) => {
    onSendMessage(prompt);
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">
              {selectedItem?.type === "mutation" && selectedItem.data
                ? `Ask me about ${selectedItem.data.rsid} (${selectedItem.data.gene_name})`
                : selectedItem?.type === "prs" && selectedItem.data
                  ? `Ask me about ${selectedItem.data.name} (${selectedItem.data.pgs_id})`
                  : selectedMutation
                    ? `Ask me about ${selectedMutation.rsid} (${selectedMutation.gene_name})`
                    : "Select a mutation or PRS to start discussing"}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm",
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                )}
              >
                {message.content}
                {message.role === "assistant" && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button className="text-xs px-2 py-1 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30">
                      Sources
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && selectedMutation && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-gray-100">
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Suggested questions:</p>
            <div className="flex flex-wrap gap-1">
              {PROMPTS.map((prompt, index) => (
                <button
                  key={index}
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

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              selectedMutation
                ? "Ask about this mutation..."
                : "Select a mutation first"
            }
            disabled={!selectedMutation}
            className="pl-2 flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !selectedMutation}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg
              className="w-4 h-4 rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
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
