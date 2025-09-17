// src/pages/UploadPage.tsx

import React from "react";
import { HelpCircle } from "lucide-react";
import type { Demographics } from "../models";
import { UPLOAD_HELPER, START_HELPER } from "../assets/copy";
import FileDropzone from "../components/FileDropzone";
import DemographicsForm from "../components/DemographicsForm";
import { DNAIcons } from "../components/DNAIcons";

interface UploadPageProps {
  selectedFile?: File;
  demographics: Demographics;
  onFileSelect: (file: File) => void;
  onDemographicsChange: (demographics: Demographics) => void;
  onStart: () => void;
  onDemo: () => void;
  isProcessing?: boolean;
}

export default function UploadPage({
  selectedFile,
  demographics,
  onFileSelect,
  onDemographicsChange,
  onStart,
  onDemo,
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
    <div className="py-12">
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
              2. Personal Information (optional)
            </h2>
            <DemographicsForm
              demographics={demographics}
              onChange={onDemographicsChange}
              disabled={isProcessing}
            />
          </div>

          {/* Start Processing */}
          <div>
            <div className="flex items-center ">
              <div className="">
                <button
                  onClick={handleStartClick}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-8 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? "Processing..." : "Start Processing"}
                </button>
              </div>
              <div className="mx-2">or</div>
              <button
                onClick={onDemo}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <div className="w-4 h-4 mr-2 mt-1/2">{DNAIcons.flask}</div>
                Try Demo with Sample Data
              </button>
            </div>

            {showError && (
              <div className="mt-3">
                <p className="text-sm text-red-600">
                  Please upload a DNA file or try the demo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Demo Option */}
        {/* <div className="text-center mt-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          <div className="mt-8">
            <button
              onClick={onDemo}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <div className="w-4 h-4 mr-2 mt-1/2">{DNAIcons.flask}</div>
              Try Demo with Sample Data
            </button>
            <p className="mt-4 text-xs text-gray-500">
              Uses a sample 23andMe file to show how the analysis works
            </p>
          </div>
        </div> */}

        {/* How it works */}
        {/* <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
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
        </div> */}
      </div>
    </div>
  );
}
