// src/pages/UploadPage.tsx

import React from "react";
import { HelpCircle } from "lucide-react";
import type { Demographics } from "../models";
import { UPLOAD_HELPER, START_HELPER } from "../assets/copy";
import FileDropzone from "../components/FileDropzone";
import DemographicsForm from "../components/DemographicsForm";

interface UploadPageProps {
  selectedFile?: File;
  demographics: Demographics;
  onFileSelect: (file: File) => void;
  onDemographicsChange: (demographics: Demographics) => void;
  onStart: () => void;
  isProcessing?: boolean;
}

export default function UploadPage({
  selectedFile,
  demographics,
  onFileSelect,
  onDemographicsChange,
  onStart,
  isProcessing = false,
}: UploadPageProps) {
  const [showError, setShowError] = React.useState(false);

  const handleStartClick = () => {
    if (!selectedFile) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onStart();
  };

  // Clear error when file is selected
  React.useEffect(() => {
    if (selectedFile) {
      setShowError(false);
    }
  }, [selectedFile]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Your DNA Data
          </h1>
          <p className="text-lg text-gray-600">
            Get personalized genetic insights from your raw DNA data
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900">
                1. Upload Your DNA File
              </h2>
              <div className="relative group">
                <HelpCircle
                  className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors"
                  aria-label="File format information"
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {UPLOAD_HELPER}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <FileDropzone
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              disabled={isProcessing}
            />
          </div>

          {/* Demographics */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              2. Personal Information
            </h2>
            <DemographicsForm
              demographics={demographics}
              onChange={onDemographicsChange}
              disabled={isProcessing}
            />
          </div>

          {/* Start Processing */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <button
                  onClick={handleStartClick}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? "Processing..." : "Start Processing"}
                </button>
              </div>
              <div className="ml-4 flex-shrink-0">
                <p className="text-sm text-gray-500">{START_HELPER}</p>
              </div>
            </div>

            {showError && (
              <div className="mt-3">
                <p className="text-sm text-red-600">
                  Please upload a DNA file.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1l3 3h4a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h4l3-3zm0 2.83L8.59 5H3v10h14V5h-5.59L10 3.83zM8 7a1 1 0 000 2h4a1 1 0 000-2H8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Privacy First
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your genetic data never leaves your device. All analysis happens
                locally in your browser. No data is sent to our servers or third
                parties.
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How it works
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <p>
                Your DNA file is parsed and validated locally in your browser
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <p>
                Genetic variants are cross-referenced with scientific literature
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <p>
                Personalized risk estimates and actionable insights are
                generated
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
