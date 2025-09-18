import React from "react";
import { useAppContext } from "../App";

interface SystemRequirementsToastProps {
  className?: string;
}

const SystemRequirementsToast: React.FC<SystemRequirementsToastProps> = ({
  className = "",
}) => {
  const { state } = useAppContext();
  const [isVisible, setIsVisible] = React.useState(true);

  // Hide toast when on report page or when manually dismissed
  if (!isVisible || state.phase === "report") {
    return null;
  }

  return (
    <div className={`fixed bottom-36 right-4 z-50 max-w-md ${className}`}>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-amber-600"
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
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-amber-800">
              System Requirements
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Recommended: MacBook Pro with 16GB+ RAM. This app downloads ~3GB
              of data and performs intensive local processing. Not recommended
              for mobile devices.
            </p>
          </div>
          <div className="flex-shrink-0 ml-2 -translate-y-1.5">
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="inline-flex rounded-md bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50 transition-colors"
              aria-label="Close system requirements notice"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemRequirementsToast;
