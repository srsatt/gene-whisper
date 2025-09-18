// src/utils/progressTracker.ts

export interface ProgressInfo {
  loaded: number;
  total: number;
  percentage: number;
  phase: string;
  totalLoaded: number; // Total bytes loaded across all files
  totalSize: number;   // Total bytes of all files combined
}

export type ProgressCallback = (progress: ProgressInfo) => void;

/**
 * Tracks download progress for fetch operations
 */
export class ProgressTracker {
  private onProgress: ProgressCallback;
  private phases: { name: string; weight: number }[];
  private totalWeight: number;
  private fileSizes: Map<string, number> = new Map(); // Track file sizes
  private loadedBytes: Map<string, number> = new Map(); // Track loaded bytes per file
  private phaseProgress: Map<string, number> = new Map(); // Track progress per phase
  private completedPhases: Set<string> = new Set(); // Track completed phases

  constructor(onProgress: ProgressCallback, phases: { name: string; weight: number }[]) {
    this.onProgress = onProgress;
    this.phases = phases;
    this.totalWeight = phases.reduce((sum, phase) => sum + phase.weight, 0);
    
    // Initialize phase progress
    phases.forEach(phase => {
      this.phaseProgress.set(phase.name, 0);
    });
  }

  /**
   * Fetches a resource with progress tracking
   */
  async fetchWithProgress(url: string, phaseName: string): Promise<Response> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    if (!contentLength) {
      // If no content-length, mark this phase as complete
      this.completePhase(phaseName);
      return response;
    }

    const total = parseInt(contentLength, 10);
    this.fileSizes.set(url, total);
    this.loadedBytes.set(url, 0);
    let loaded = 0;

    const reader = response.body?.getReader();
    if (!reader) {
      return response;
    }

    const stream = new ReadableStream({
      start: (controller) => {
        const pump = async (): Promise<void> => {
          try {
            const { done, value } = await reader.read();
            
            if (done) {
              // Mark this file as complete
              this.loadedBytes.set(url, total);
              this.updatePhaseProgress(phaseName, 1.0);
              controller.close();
              return;
            }

            loaded += value.byteLength;
            this.loadedBytes.set(url, loaded);
            const progress = total > 0 ? loaded / total : 0;
            this.updatePhaseProgress(phaseName, progress);
            
            controller.enqueue(value);
            return pump();
          } catch (error) {
            controller.error(error);
          }
        };
        
        return pump();
      }
    });

    return new Response(stream, {
      headers: response.headers
    });
  }

  /**
   * Updates progress for a specific phase
   */
  private updatePhaseProgress(phaseName: string, progress: number) {
    this.phaseProgress.set(phaseName, progress);
    this.calculateOverallProgress(phaseName);
  }

  /**
   * Calculates and reports overall progress
   */
  private calculateOverallProgress(currentPhase: string) {
    // Calculate cumulative totals for file size display
    const totalSize = Array.from(this.fileSizes.values()).reduce((sum, size) => sum + size, 0);
    const totalLoaded = Array.from(this.loadedBytes.values()).reduce((sum, bytes) => sum + bytes, 0);

    // Simple percentage based on actual bytes downloaded vs total bytes
    const percentage = totalSize > 0 ? Math.min(Math.max((totalLoaded / totalSize) * 100, 0), 100) : 0;

    // Find current file info for display
    let currentLoaded = 0;
    let currentTotal = 0;
    
    // Find the file associated with the current phase
    for (const [url, loaded] of this.loadedBytes.entries()) {
      const fileSize = this.fileSizes.get(url) || 0;
      if (loaded < fileSize) { // This file is still downloading
        currentLoaded = loaded;
        currentTotal = fileSize;
        break;
      }
    }

    this.onProgress({
      loaded: currentLoaded,
      total: currentTotal,
      percentage,
      phase: currentPhase,
      totalLoaded,
      totalSize
    });
  }

  /**
   * Marks a phase as complete
   */
  completePhase(phaseName: string) {
    this.completedPhases.add(phaseName);
    this.updatePhaseProgress(phaseName, 1.0);
  }
}

/**
 * Creates a fetch function with progress tracking
 */
export function createProgressFetch(
  onProgress: ProgressCallback,
  phases: { name: string; weight: number }[]
) {
  const tracker = new ProgressTracker(onProgress, phases);
  
  return {
    fetchWithProgress: (url: string, phaseName: string) => 
      tracker.fetchWithProgress(url, phaseName),
    completePhase: (phaseName: string) => 
      tracker.completePhase(phaseName)
  };
}
