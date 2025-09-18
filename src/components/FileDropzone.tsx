// src/components/FileDropzone.tsx

import React, { useCallback, useState } from "react";
import { cn } from "../tools";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File;
  disabled?: boolean;
}

export default function FileDropzone({
  onFileSelect,
  selectedFile,
  disabled,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const validFile = files.find(
        (file) => file.name.endsWith(".txt") || file.name.endsWith(".vcf") || file.name.endsWith(".csv")
      );

      if (validFile) {
        onFileSelect(validFile);
      }
    },
    [onFileSelect, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
          isDragOver && !disabled
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload DNA file"
        aria-describedby="file-upload-description"
      >
        <input
          type="file"
          accept=".txt,.vcf"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Choose DNA file"
        />

        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {selectedFile ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-600">
                ✓ {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">
                Drop your DNA file here, or click to browse
              </p>
              <p id="file-upload-description" className="text-xs text-gray-500">
                .txt or .vcf files up to 50MB
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
