// src/pages/ReportPage.tsx

import React, { useState, useEffect } from 'react';
import type { Report, ChatMessage } from '../models';
import ReportLayout from '../components/ReportLayout';

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
  onBack
}: ReportPageProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with back button */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="Go back to upload"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Your Genetic Report
              </h1>
              <p className="text-sm text-gray-500">
                {report.findings.length} findings • Generated {report.generatedAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Export button */}
            <button
              onClick={() => {
                const dataStr = JSON.stringify(report, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `genetic-report-${report.generatedAt.toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Export Report
            </button>
            
            {/* Settings dropdown */}
            <div className="relative">
              <button
                className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Report settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div className="flex-1 overflow-hidden">
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
