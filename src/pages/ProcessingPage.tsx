// src/pages/ProcessingPage.tsx

import React, { useState, useEffect } from "react";
import { LOADER_LINES, PROCESSING_SUB } from "../assets/copy";

interface ProcessingPageProps {
  onCancel: () => void;
  fileName?: string;
}

export default function ProcessingPage({
  onCancel,
  fileName,
}: ProcessingPageProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const lineInterval = setInterval(() => {
      setCurrentLineIndex((prev) => (prev + 1) % LOADER_LINES.length);
    }, 1500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 200);

    return () => {
      clearInterval(lineInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Processing Your DNA Data
          </h1>
          <p className="text-lg text-gray-600 mb-8">{PROCESSING_SUB}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* File info */}
          {fileName && (
            <div className="mb-6 p-3 bg-blue-50 rounded-md">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-900">
                  {fileName}
                </span>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-6 mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{LOADER_LINES[currentLineIndex]}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Animated spinner */}
          {/* <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div> */}

          {/* Current processing step */}
          {/* <div className="text-center mb-8">
            <div className="min-h-[3rem] flex items-center justify-center">
              <p className="text-sm text-gray-700 font-medium">
                {LOADER_LINES[currentLineIndex]}
              </p>
            </div>
          </div> */}

          {/* Processing steps preview */}
          <div className="space-y-2 mb-8">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Processing Steps:
            </h3>
            <div className="grid gap-1 text-xs text-gray-600">
              {LOADER_LINES.map((line, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 py-1 px-2 rounded ${
                    index === currentLineIndex
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : index < currentLineIndex
                        ? "text-green-600"
                        : "text-gray-500"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {index < currentLineIndex ? (
                      <svg
                        className="w-3 h-3 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : index === currentLineIndex ? (
                      <div className="w-3 h-3 border-2 border-blue-600 rounded-full animate-pulse"></div>
                    ) : (
                      <div className="w-3 h-3 border border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Cancel button */}
      <div className="text-center pt-4">
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
        >
          Cancel & re-upload
        </button>
      </div>
    </div>
  );
}
