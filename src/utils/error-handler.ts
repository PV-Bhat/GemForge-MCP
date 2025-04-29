import { GoogleGenerativeAI } from '@google/generative-ai';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { MODELS } from '../config/models.js';

/**
 * Custom error class for Gemini API errors
 */
export class GeminiError extends Error {
  /** HTTP status code (if applicable) */
  status?: number;
  
  /** Error code for categorization */
  code: string;
  
  /** Whether the error is a rate limit error */
  isRateLimit: boolean;
  
  /** Whether the error is retriable */
  isRetriable: boolean;
  
  /**
   * Creates a new GeminiError
   * @param message Error message
   * @param status HTTP status code (if applicable)
   * @param code Error code
   * @param isRateLimit Whether it's a rate limit error
   * @param isRetriable Whether the error is retriable
   */
  constructor(
    message: string, 
    status?: number, 
    code = 'UNKNOWN_ERROR',
    isRateLimit = false,
    isRetriable = false
  ) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.code = code;
    this.isRateLimit = isRateLimit;
    this.isRetriable = isRetriable;
  }
}

/**
 * Categorizes and handles API errors
 * @param error The error to handle
 * @param modelId The model ID that was being used
 * @returns A standardized GeminiError
 */
export function handleApiError(error: unknown, modelId?: string): GeminiError {
  // Get model display name if available
  let modelDisplay = 'Gemini API';
  if (modelId && MODELS[modelId]) {
    modelDisplay = MODELS[modelId].displayName;
  }

  // Handle Google Generative AI SDK errors
  // Enhanced error handling for Google Generative AI SDK
  console.error(`Processing error from ${modelDisplay}:`, error);
  
  if (error instanceof Error) {
    const message = error.message;
    
    // Enhanced error detection with more patterns
    // Invalid request cases
    if (message.includes('invalid') || 
        message.includes('validation') || 
        message.includes('parameter') || 
        message.includes('malformed') ||
        message.includes('bad request')) {
      return new GeminiError(
        `Invalid request to ${modelDisplay}: ${message}`,
        400,
        'INVALID_REQUEST',
        false,
        false
      );
    }
    
    // Authentication issues
    if (message.includes('auth') || 
        message.includes('key') || 
        message.includes('token') || 
        message.includes('credential') ||
        message.includes('api key') ||
        message.includes('unauthorized')) {
      return new GeminiError(
        `Authentication error with ${modelDisplay}: ${message}`,
        401,
        'UNAUTHORIZED',
        false,
        false
      );
    }
    
    // Permission issues
    if (message.includes('permission') || 
        message.includes('access') || 
        message.includes('forbidden') ||
        message.includes('not allowed')) {
      return new GeminiError(
        `Permission error for ${modelDisplay}: ${message}`,
        403,
        'FORBIDDEN',
        false,
        false
      );
    }
    
    // Not found issues
    if (message.includes('not found') || 
        message.includes('model') && message.includes('exist') ||
        message.includes('404') ||
        message.includes('unknown model')) {
      return new GeminiError(
        `Model not found: ${modelDisplay}. Please check the model name and try again.`,
        404,
        'NOT_FOUND',
        false,
        false
      );
    }
    
    // Rate limiting and quota issues
    if (message.includes('rate') || 
        message.includes('limit') || 
        message.includes('quota') ||
        message.includes('too many') ||
        message.includes('429') ||
        message.includes('exceeded') ||
        message.includes('throttl')) {
      return new GeminiError(
        `Rate limit exceeded for ${modelDisplay}. Please reduce your request frequency and try again later.`,
        429,
        'RATE_LIMIT_EXCEEDED',
        true,
        true
      );
    }
    
    // Content safety filter issues
    if (message.includes('safety') || 
        message.includes('harmful') || 
        message.includes('filter') ||
        message.includes('blocked') ||
        message.includes('violat')) {
      return new GeminiError(
        `Content filtered by ${modelDisplay} safety systems: ${message}`,
        400,
        'SAFETY_FILTER',
        false,
        false
      );
    }
    
    // Server-side issues
    if (message.includes('server') || 
        message.includes('unavailable') ||
        message.includes('timeout') ||
        message.includes('overloaded') ||
        message.includes('500') ||
        message.includes('503') ||
        message.includes('internal')) {
      return new GeminiError(
        `${modelDisplay} server error: ${message}. Please try again later.`,
        500,
        'SERVER_ERROR',
        false,
        true
      );
    }
    
    // File processing errors
    if (message.includes('file') || 
        message.includes('image') || 
        message.includes('document') ||
        message.includes('format') ||
        message.includes('too large')) {
      return new GeminiError(
        `File processing error with ${modelDisplay}: ${message}`,
        400,
        'FILE_ERROR',
        false,
        false
      );
    }
  }
  
  // Handle GeminiError that might be passed through
  if (error instanceof GeminiError) {
    return error;
  }
  
  // Handle general Error objects
  if (error instanceof Error) {
    return new GeminiError(
      error.message,
      undefined,
      'UNKNOWN_ERROR',
      error.message.includes('rate limit'),
      error.message.includes('rate limit')
    );
  }
  
  // Handle completely unknown errors
  return new GeminiError(
    `Unknown error occurred with ${modelDisplay}`,
    undefined,
    'UNKNOWN_ERROR',
    false,
    false
  );
}

/**
 * Formats an error response for the MCP protocol
 * @param error The error to format
 * @returns Formatted error response for MCP
 */
export function formatErrorResponse(error: unknown): any {
  const geminiError = error instanceof GeminiError 
    ? error 
    : handleApiError(error);
  
  return {
    content: [
      {
        type: 'text',
        text: geminiError.message,
      },
    ],
    isError: true,
    metadata: {
      errorCode: geminiError.code,
      status: geminiError.status,
      isRetriable: geminiError.isRetriable
    }
  };
}

/**
 * Converts an API error to an MCP error
 * @param error The error to convert
 * @returns An MCP error
 */
export function toMcpError(error: unknown): McpError {
  const geminiError = error instanceof GeminiError 
    ? error 
    : handleApiError(error);
  
  // Map Gemini error codes to MCP error codes
  let mcpErrorCode: ErrorCode;
  switch (geminiError.code) {
    case 'INVALID_REQUEST':
      mcpErrorCode = ErrorCode.InvalidParams;
      break;
    case 'UNAUTHORIZED':
    case 'FORBIDDEN':
      mcpErrorCode = ErrorCode.InvalidParams;
      break;
    case 'NOT_FOUND':
      mcpErrorCode = ErrorCode.MethodNotFound;
      break;
    case 'RATE_LIMIT_EXCEEDED':
      mcpErrorCode = ErrorCode.InternalError;
      break;
    case 'SERVER_ERROR':
      mcpErrorCode = ErrorCode.InternalError;
      break;
    default:
      mcpErrorCode = ErrorCode.InternalError;
  }
  
  return new McpError(mcpErrorCode, geminiError.message);
}

/**
 * Extracts error message from API response data
 * @param data API response data
 * @returns Extracted error message or default message
 */
function getErrorMessage(data: any): string {
  if (data?.error?.message) {
    return data.error.message;
  }
  
  if (data?.error) {
    return JSON.stringify(data.error);
  }
  
  return 'Unknown error';
}
