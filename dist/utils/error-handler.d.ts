import { McpError } from '@modelcontextprotocol/sdk/types.js';
/**
 * Custom error class for Gemini API errors
 */
export declare class GeminiError extends Error {
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
    constructor(message: string, status?: number, code?: string, isRateLimit?: boolean, isRetriable?: boolean);
}
/**
 * Categorizes and handles API errors
 * @param error The error to handle
 * @param modelId The model ID that was being used
 * @returns A standardized GeminiError
 */
export declare function handleApiError(error: unknown, modelId?: string): GeminiError;
/**
 * Formats an error response for the MCP protocol
 * @param error The error to format
 * @returns Formatted error response for MCP
 */
export declare function formatErrorResponse(error: unknown): any;
/**
 * Converts an API error to an MCP error
 * @param error The error to convert
 * @returns An MCP error
 */
export declare function toMcpError(error: unknown): McpError;
