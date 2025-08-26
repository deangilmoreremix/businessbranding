'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AnalysisError, AnalysisErrorType } from '@/lib/types/errors';

interface ErrorStateProps {
  error: Error | AnalysisError;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const isAnalysisError = error instanceof AnalysisError;
  const errorType = isAnalysisError ? error.type : AnalysisErrorType.UNKNOWN_ERROR;

  const getErrorMessage = () => {
    if (isAnalysisError) {
      switch (errorType) {
        case AnalysisErrorType.API_ERROR:
          return 'Failed to connect to analysis service. Please try again.';
        case AnalysisErrorType.PARSING_ERROR:
          return 'Failed to process analysis results. Please try again.';
        case AnalysisErrorType.VALIDATION_ERROR:
          return 'Invalid analysis data received. Please try again.';
        case AnalysisErrorType.NETWORK_ERROR:
          return 'Network connection error. Please check your connection and try again.';
        case AnalysisErrorType.RATE_LIMIT_ERROR:
          return 'Too many requests. Please wait a moment and try again.';
        default:
          return error.message;
      }
    }
    return error.message || 'An unexpected error occurred';
  };

  return (
    <Card className="p-6 border-destructive/50 bg-destructive/10">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="text-lg font-semibold mb-2">Analysis Error</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {getErrorMessage()}
          </p>
          {isAnalysisError && error.details && (
            <pre className="text-xs text-muted-foreground bg-background/50 p-2 rounded mb-4 overflow-auto">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          )}
        </div>
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </Card>
  );
}