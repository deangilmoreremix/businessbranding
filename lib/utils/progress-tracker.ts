import { MutableRefObject } from 'react';
import debounce from 'lodash.debounce';

export interface ProgressTrackerOptions {
  /** Initial progress value (0-100) */
  initialProgress?: number;
  /** Maximum progress value before completion */
  maxProgress?: number;
  /** Interval duration in milliseconds */
  interval?: number;
  /** Progress increment per interval */
  increment?: number;
  /** Optional callback when progress updates */
  onProgress?: (progress: number) => void;
  /** Optional callback when operation completes */
  onComplete?: () => void;
}

export interface ProgressTracker {
  /** Start the progress tracking */
  start: () => void;
  /** Complete the progress tracking */
  complete: () => void;
  /** Stop and cleanup the progress tracking */
  stop: () => void;
  /** Check if tracking is active */
  isActive: () => boolean;
  /** Get current progress value */
  getProgress: () => number;
}

/**
 * Creates a progress tracker that manages interval-based progress updates
 * with debounced updates to prevent flickering
 */
export function createProgressTracker(
  progressRef: MutableRefObject<number>,
  setProgress: (progress: number) => void,
  options: ProgressTrackerOptions = {}
): ProgressTracker {
  const {
    initialProgress = 0,
    maxProgress = 95,
    interval = 1000,
    increment = 5,
    onProgress,
    onComplete
  } = options;

  let intervalId: NodeJS.Timeout | null = null;
  let isTracking = false;

  // Debounce the progress updates to prevent rapid re-renders
  const debouncedProgressUpdate = debounce((value: number) => {
    progressRef.current = value;
    setProgress(value);
    onProgress?.(value);
  }, 100);

  /**
   * Updates the progress value with debouncing
   */
  const updateProgress = (value: number) => {
    const newProgress = Math.min(value, maxProgress);
    debouncedProgressUpdate(newProgress);
  };

  /**
   * Cleans up the interval and resets tracking state
   */
  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    debouncedProgressUpdate.cancel();
    isTracking = false;
  };

  return {
    start: () => {
      if (isTracking) return;

      isTracking = true;
      updateProgress(initialProgress);

      intervalId = setInterval(() => {
        if (progressRef.current >= maxProgress) {
          cleanup();
          return;
        }

        updateProgress(progressRef.current + increment);
      }, interval);
    },

    complete: () => {
      cleanup();
      debouncedProgressUpdate.cancel(); // Cancel any pending updates
      progressRef.current = 100;
      setProgress(100);
      onComplete?.();
    },

    stop: () => {
      cleanup();
    },

    isActive: () => isTracking,

    getProgress: () => progressRef.current
  };
}