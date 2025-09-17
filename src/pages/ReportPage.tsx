// src/pages/ReportPage.tsx

import React, { useState, useEffect } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Report, ChatMessage } from "../models";
import ReportLayout from "../components/ReportLayout";

interface ReportPageProps {
  report: Report;
  selectedFindingId?: string;
  chatMessages: ChatMessage[];
  onDiscuss: (findingId: string) => void;
  onSendMessage: (content: string) => void;
  onBack: () => void;
}

export default function ReportPage({
  report,
  selectedFindingId,
  chatMessages,
  onDiscuss,
  onSendMessage,
  onBack,
}: ReportPageProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll to top when report page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with back button */}
      <div className="sticky top-[37px] z-1 flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="Go back to upload"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Your Genetic Report
              </h1>
              <p className="text-sm text-gray-500">
                {report.findings.length} findings • Generated{" "}
                {report.generatedAt.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Export button */}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    disabled
                    className="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
                  >
                    Export Report
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-md animate-in fade-in-0 zoom-in-95"
                    sideOffset={5}
                  >
                    Coming soon
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>

            {/* Settings dropdown */}
            {/* <div className="relative">
              <button
                className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Report settings"
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
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Report content */}
      <div className="flex-1">
        <ReportLayout
          report={report}
          selectedFindingId={selectedFindingId}
          chatMessages={chatMessages}
          onDiscuss={onDiscuss}
          onSendMessage={onSendMessage}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
