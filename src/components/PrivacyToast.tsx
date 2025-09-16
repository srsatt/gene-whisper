import React from "react";

interface PrivacyToastProps {
  className?: string;
}

const PrivacyToast: React.FC<PrivacyToastProps> = ({ className = "" }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-md ${className}`}>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-green-800">
              Privacy First
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Your genetic data never leaves your device. All analysis happens
              locally in your browser. No data is sent to our servers or third
              parties.
            </p>
          </div>
          <div className="flex-shrink-0 ml-2 -translate-y-1.5">
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50 transition-colors"
              aria-label="Close privacy notice"
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

export default PrivacyToast;
