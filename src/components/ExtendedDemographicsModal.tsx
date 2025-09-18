import { useState } from "react";
import type { ExtendedDemographics } from "../models";
import ExtendedDemographicsForm from "./ExtendedDemographicsForm";
import { cn } from "../tools";

interface ExtendedDemographicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  extendedDemographics: ExtendedDemographics;
  onSave: (extendedDemographics: ExtendedDemographics) => void;
}

export default function ExtendedDemographicsModal({
  isOpen,
  onClose,
  extendedDemographics,
  onSave,
}: ExtendedDemographicsModalProps) {
  const [formData, setFormData] =
    useState<ExtendedDemographics>(extendedDemographics);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving extended demographics:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form data to original values when closing without saving
    setFormData(extendedDemographics);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black opacity-50 transition-opacity"
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Extended Demographics
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Provide additional information to enhance your medical
                consultations
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <ExtendedDemographicsForm
              extendedDemographics={formData}
              onChange={setFormData}
              disabled={isSaving}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              This information will be used to provide more personalized medical
              insights
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className={cn(
                  "px-4 py-2 text-sm font-medium border border-gray-300 rounded-md",
                  "text-gray-700 bg-white hover:bg-gray-50",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isSaving && "opacity-50 cursor-not-allowed"
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "px-4 py-2 text-sm font-medium border border-transparent rounded-md",
                  "text-white bg-blue-600 hover:bg-blue-700",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isSaving && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <title>Loading</title>
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </div>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
