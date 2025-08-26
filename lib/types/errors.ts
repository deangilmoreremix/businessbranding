export enum AnalysisErrorType {
  API_ERROR = 'API_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AnalysisError extends Error {
  constructor(
    public type: AnalysisErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export function isAnalysisError(error: unknown): error is AnalysisError {
  return error instanceof AnalysisError;
}