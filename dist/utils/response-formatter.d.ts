/**
 * Response options for formatting
 */
export interface ResponseOptions {
    /** Whether to include thinking mode output */
    includeThinking?: boolean;
    /** Whether to format search results */
    includeSearch?: boolean;
    /** Custom formatting options */
    customFormat?: Record<string, any>;
    /** Operation type (e.g., GEM_SEARCH, GEM_REASON, etc.) */
    operation?: string;
    /** Processing type for GEM_PROCESS operation */
    processingType?: string;
    /** Whether the request included a file */
    withFile?: boolean;
    /** Whether thinking mode is enabled */
    thinking?: boolean;
    /** Whether to show steps (for reasoning) */
    showSteps?: boolean;
    /** Capability level used */
    capabilityLevel?: string;
    /** Whether the file is an image */
    isImageFile?: boolean;
    /** File type category */
    fileType?: string;
}
/**
 * Formats responses from the Gemini API in a consistent way
 * @param response The API response data
 * @param modelId The model ID that was used
 * @param options Formatting options
 * @param sdkResponse Optional raw SDK response object
 * @returns Formatted response for MCP
 */
export declare function formatResponse(response: any, modelId: string, options?: ResponseOptions, sdkResponse?: any): any;
