// src/components/ReportLayout.tsx

import React, { useState, useEffect } from "react";
import type { Report, Finding, EvidenceLevel, ChatMessage } from "../models";
import { EVIDENCE_MAP, STAR_RATING_MAP } from "../assets/copy";
import { adjustRiskScore, formatAbsoluteRisk, cn } from "../tools";
import { saveUIPreferences, getUIPreferences } from "../db";
import RiskMeter from "./RiskMeter";
import WhatIfControls from "./WhatIfControls";
import ChatSidebar from "./ChatSidebar";

interface ReportLayoutProps {
  report: Report;
  selectedFindingId?: string;
  chatMessages: ChatMessage[];
  onDiscuss: (findingId: string) => void;
  onSendMessage: (content: string) => void;
}

interface FindingCardProps {
  finding: Finding;
  demographics?: Report["demographics"];
  onDiscuss: (findingId: string) => void;
  isSelected: boolean;
}

function FindingCard({
  finding,
  demographics,
  onDiscuss,
  isSelected,
}: FindingCardProps) {
  const [whatIfValues, setWhatIfValues] = useState<
    Record<string, number | boolean>
  >({});
  const [showActions, setShowActions] = useState(false);

  // Initialize what-if values
  useEffect(() => {
    const initialValues: Record<string, number | boolean> = {};
    finding.whatIf.forEach((whatIf) => {
      if (whatIf.type === "toggle") {
        initialValues[whatIf.id] = Boolean(whatIf.currentValue);
      } else {
        initialValues[whatIf.id] = Number(whatIf.currentValue);
      }
    });
    setWhatIfValues(initialValues);
  }, [finding.whatIf]);

  const adjustedRiskScore = adjustRiskScore(
    finding.baseRiskScore,
    whatIfValues
  );

  return (
    <div
      className={cn(
        "bg-white rounded-lg border p-6 transition-all",
        isSelected
          ? "border-blue-500 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {finding.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">{finding.summary}</p>
        </div>
      </div>

      {/* Genetic Variants */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {finding.variants.map((variant) => (
            <div key={variant.rsid} className="flex items-center gap-1">
              <span
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                title={`${variant.gene_name} - ${variant.phenotype}`}
              >
                {variant.rsid}
              </span>
              <span
                className={cn(
                  "px-1 py-0.5 text-xs rounded font-medium",
                  variant.evidence_level === "4 Stars"
                    ? "bg-green-100 text-green-800"
                    : variant.evidence_level === "3 Stars"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-700"
                )}
                title={`Evidence: ${variant.evidence_level}`}
              >
                {variant.evidence_level}
              </span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          Genes: {finding.variants.map((v) => v.gene_name).join(", ")}
        </div>
      </div>

      {/* Absolute risk */}
      {finding.absoluteRisk && (
        <p className="text-sm text-gray-600 mb-4">{finding.absoluteRisk}</p>
      )}

      {/* Risk meter */}
      {/* <RiskMeter
        value={adjustedRiskScore}
        label="Current Risk Score"
        uncertaintyRange={finding.uncertaintyRange}
        className="mb-4"
      /> */}

      {/* What-if controls */}
      {finding.whatIf.length > 0 && (
        <div className="mb-4">
          <WhatIfControls
            whatIfs={finding.whatIf}
            values={whatIfValues}
            onChange={setWhatIfValues}
          />
        </div>
      )}

      {/* Actions */}
      {finding.actions.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowActions(!showActions)}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <span>Top actions</span>
            <svg
              className={cn(
                "w-4 h-4 ml-1 transition-transform",
                showActions && "rotate-180"
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

          {showActions && (
            <div className="mt-2 space-y-2">
              {finding.actions.slice(0, 3).map((action) => (
                <div key={action.id} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {action.title}
                    </h4>
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        action.evidenceLevel === "A"
                          ? "bg-green-100 text-green-800"
                          : action.evidenceLevel === "B"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {action.evidenceLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => onDiscuss(finding.id)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
        >
          Discuss in Chat
        </button>
      </div>
    </div>
  );
}

export default function ReportLayout({
  report,
  selectedFindingId,
  chatMessages,
  onDiscuss,
  onSendMessage,
}: ReportLayoutProps) {
  const [evidenceExpanded, setEvidenceExpanded] = useState<
    Record<EvidenceLevel, boolean>
  >({
    A: true,
    B: false,
    C: false,
  });
  const [chatOpen, setChatOpen] = useState(false);

  // Load UI preferences
  useEffect(() => {
    const preferences = getUIPreferences();
    setEvidenceExpanded(preferences.evidenceExpanded);
    setChatOpen(preferences.chatOpen);
  }, []);

  // Save UI preferences when they change
  useEffect(() => {
    saveUIPreferences({ evidenceExpanded, chatOpen });
  }, [evidenceExpanded, chatOpen]);

  const toggleEvidenceLevel = (level: EvidenceLevel) => {
    setEvidenceExpanded((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const selectedFinding = selectedFindingId
    ? report.findings.find((f) => f.id === selectedFindingId)
    : undefined;

  // Group findings by evidence level
  const findingsByEvidence = report.findings.reduce(
    (acc, finding) => {
      if (!acc[finding.evidenceLevel]) {
        acc[finding.evidenceLevel] = [];
      }
      acc[finding.evidenceLevel].push(finding);
      return acc;
    },
    {} as Record<EvidenceLevel, Finding[]>
  );

  // High-risk findings for proactive advice
  const highRiskFindings = report.findings.filter(
    (f) => f.riskLevel === "High"
  );

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Header */}
          {/* <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                Quality: {report.quality}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                {report.vendor}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                Last updated: {report.generatedAt.toLocaleDateString()}
              </span>
            </div>
          </div> */}

          {/* Proactive advice */}
          {/* {highRiskFindings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-amber-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-amber-800">
                    Personalized Tips
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    You have {highRiskFindings.length} high-risk finding
                    {highRiskFindings.length > 1 ? "s" : ""}. Consider
                    discussing these with your healthcare provider.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {highRiskFindings.slice(0, 3).map((finding) => (
                      <button
                        key={finding.id}
                        onClick={() => onDiscuss(finding.id)}
                        className="text-xs px-3 py-1 bg-amber-200 text-amber-800 rounded-full hover:bg-amber-300"
                      >
                        {finding.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* Evidence groups */}
          <div className="space-y-6">
            {(["A", "B", "C"] as EvidenceLevel[]).map((level) => {
              const findings = findingsByEvidence[level] || [];
              if (findings.length === 0) return null;

              return (
                <div key={level} className="space-y-4">
                  <button
                    onClick={() => toggleEvidenceLevel(level)}
                    className="flex items-center justify-between w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <h2 className="text-xl font-semibold text-gray-900">
                      {EVIDENCE_MAP[level]} ({findings.length})
                    </h2>
                    <svg
                      className={cn(
                        "w-6 h-6 transition-transform",
                        evidenceExpanded[level] && "rotate-180"
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

                  {evidenceExpanded[level] && (
                    <div className="grid gap-4">
                      {findings.map((finding) => (
                        <FindingCard
                          key={finding.id}
                          finding={finding}
                          demographics={report.demographics}
                          onDiscuss={onDiscuss}
                          isSelected={finding.id === selectedFindingId}
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
        selectedFinding={selectedFinding}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
