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
  private currentPhaseIndex = 0;
  private totalWeight: number;
  private fileSizes: Map<string, number> = new Map(); // Track file sizes
  private loadedBytes: Map<string, number> = new Map(); // Track loaded bytes per file

  constructor(onProgress: ProgressCallback, phases: { name: string; weight: number }[]) {
    this.onProgress = onProgress;
    this.phases = phases;
    this.totalWeight = phases.reduce((sum, phase) => sum + phase.weight, 0);
  }

  /**
   * Fetches a resource with progress tracking
   */
  async fetchWithProgress(url: string, phaseName: string): Promise<Response> {
    const phaseIndex = this.phases.findIndex(p => p.name === phaseName);
    if (phaseIndex !== -1) {
      this.currentPhaseIndex = phaseIndex;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    if (!contentLength) {
      // If no content-length, we can't track progress for this specific download
      // Just update to show we're in this phase
      this.updateProgress(url, 0, 1, phaseName);
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
              this.updateProgress(url, total, total, phaseName);
              controller.close();
              return;
            }

            loaded += value.byteLength;
            this.loadedBytes.set(url, loaded);
            this.updateProgress(url, loaded, total, phaseName);
            
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
   * Updates progress based on current phase
   */
  private updateProgress(_url: string, loaded: number, total: number, phase: string) {
    // Calculate cumulative totals
    const totalSize = Array.from(this.fileSizes.values()).reduce((sum, size) => sum + size, 0);
    const totalLoaded = Array.from(this.loadedBytes.values()).reduce((sum, bytes) => sum + bytes, 0);

    // Calculate progress for completed phases
    let completedWeight = 0;
    for (let i = 0; i < this.currentPhaseIndex; i++) {
      completedWeight += this.phases[i].weight;
    }

    // Calculate progress for current phase
    const currentPhaseWeight = this.phases[this.currentPhaseIndex]?.weight || 0;
    const currentPhaseProgress = total > 0 ? (loaded / total) : 0;
    const currentPhaseWeightedProgress = currentPhaseWeight * currentPhaseProgress;

    // Calculate overall progress
    const totalProgress = (completedWeight + currentPhaseWeightedProgress) / this.totalWeight;
    const percentage = Math.min(Math.max(totalProgress * 100, 0), 100);

    this.onProgress({
      loaded,
      total,
      percentage,
      phase,
      totalLoaded,
      totalSize
    });
  }

  /**
   * Marks a phase as complete
   */
  completePhase(phaseName: string) {
    const phaseIndex = this.phases.findIndex(p => p.name === phaseName);
    if (phaseIndex !== -1) {
      this.currentPhaseIndex = phaseIndex;
      this.updateProgress('', 1, 1, phaseName);
      this.currentPhaseIndex++;
    }
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
