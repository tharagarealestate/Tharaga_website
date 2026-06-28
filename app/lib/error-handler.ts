/**
 * Advanced Error Handling Utilities
 * Classifies errors and provides appropriate handling strategies
 */

export type ErrorType = 
  | 'NO_DATA'           // Empty results - show empty state
  | 'AUTH_ERROR'        // 401/403 - show access denied
  | 'NETWORK_ERROR'     // Network/timeout - show retry
  | 'DATABASE_ERROR'    // Table/query issues - show technical error
  | 'VALIDATION_ERROR'  // Invalid input - show validation message
  | 'UNKNOWN_ERROR';    // Unknown - show generic error

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  technicalDetails?: string;
  retryable: boolean;
  statusCode?: number;
}

/**
 * Classify Supabase errors
 */
export function classifySupabaseError(error: any, data: any[] | null = null): ClassifiedError {
  // Check if it's actually just empty data (not an error)
  if (!error && (data === null || (Array.isArray(data) && data.length === 0))) {
    return {
      type: 'NO_DATA',
      message: 'No data available',
      userMessage: 'No data found. This is normal if you haven\'t created any records yet.',
      retryable: false,
    };
  }

  // If there's an error object
  if (error) {
    const errorMessage = error.message || String(error);
    const errorCode = error.code || error.status || error.statusCode;

    // Authentication errors
    if (errorCode === 'PGRST301' || errorCode === 401 || errorMessage.includes('JWT') || errorMessage.includes('unauthorized')) {
      return {
        type: 'AUTH_ERROR',
        message: errorMessage,
        userMessage: 'Access denied. Please check your permissions or log in again.',
        technicalDetails: errorMessage,
        retryable: false,
        statusCode: 401,
      };
    }

    // Permission errors
    if (errorCode === 'PGRST301' || errorCode === 403 || errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
      return {
        type: 'AUTH_ERROR',
        message: errorMessage,
        userMessage: 'You don\'t have permission to access this resource.',
        technicalDetails: errorMessage,
        retryable: false,
        statusCode: 403,
      };
    }

    // Table doesn't exist
    if (errorCode === 'PGRST116' || errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return {
        type: 'DATABASE_ERROR',
        message: errorMessage,
        userMessage: 'Database table not found. Please contact support.',
        technicalDetails: `Table missing: ${errorMessage}`,
        retryable: false,
        statusCode: 500,
      };
    }

    // Network/timeout errors
    if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED' || errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return {
        type: 'NETWORK_ERROR',
        message: errorMessage,
        userMessage: 'Network error. Please check your connection and try again.',
        technicalDetails: errorMessage,
        retryable: true,
        statusCode: 503,
      };
    }

    // Rate limiting
    if (errorCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        type: 'NETWORK_ERROR',
        message: errorMessage,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        technicalDetails: errorMessage,
        retryable: true,
        statusCode: 429,
      };
    }

    // Generic database errors
    if (errorCode?.startsWith('PGRST') || errorMessage.includes('database') || errorMessage.includes('query')) {
      return {
        type: 'DATABASE_ERROR',
        message: errorMessage,
        userMessage: 'Database error occurred. Please contact support if this persists.',
        technicalDetails: errorMessage,
        retryable: false,
        statusCode: 500,
      };
    }

    // Unknown error
    return {
      type: 'UNKNOWN_ERROR',
      message: errorMessage,
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalDetails: errorMessage,
      retryable: true,
      statusCode: 500,
    };
  }

  // Default: no error, just no data
  return {
    type: 'NO_DATA',
    message: 'No data available',
    userMessage: 'No data found.',
    retryable: false,
  };
}

/**
 * Classify HTTP response errors
 */
export function classifyHttpError(status: number, errorData?: any): ClassifiedError {
  const errorMessage = errorData?.error || errorData?.message || 'Unknown error';

  switch (status) {
    case 401:
      return {
        type: 'AUTH_ERROR',
        message: errorMessage,
        userMessage: 'Please log in to continue.',
        retryable: false,
        statusCode: 401,
      };

    case 403:
      return {
        type: 'AUTH_ERROR',
        message: errorMessage,
        userMessage: 'You don\'t have permission to access this resource.',
        retryable: false,
        statusCode: 403,
      };

    case 404:
      return {
        type: 'NO_DATA',
        message: errorMessage,
        userMessage: 'Resource not found.',
        retryable: false,
        statusCode: 404,
      };

    case 429:
      return {
        type: 'NETWORK_ERROR',
        message: errorMessage,
        userMessage: 'Too many requests. Please wait a moment.',
        retryable: true,
        statusCode: 429,
      };

    case 500:
    case 502:
    case 503:
      return {
        type: 'NETWORK_ERROR',
        message: errorMessage,
        userMessage: 'Server error. Please try again in a moment.',
        technicalDetails: errorMessage,
        retryable: true,
        statusCode: status,
      };

    case 400:
      return {
        type: 'VALIDATION_ERROR',
        message: errorMessage,
        userMessage: errorMessage,
        retryable: false,
        statusCode: 400,
      };

    default:
      return {
        type: 'UNKNOWN_ERROR',
        message: errorMessage,
        userMessage: 'An error occurred. Please try again.',
        retryable: true,
        statusCode: status,
      };
  }
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: ClassifiedError): string {
  return error.userMessage;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ClassifiedError): boolean {
  return error.retryable;
}
