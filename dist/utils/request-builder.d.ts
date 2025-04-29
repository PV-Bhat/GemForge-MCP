import { CodeArgs, FileopsArgs } from '../interfaces/tool-args.js';
/**
 * Interface for internal request format
 */
export interface InternalRequest {
    modelId?: string;
    messages: Array<{
        role: string;
        parts: Array<{
            text: string;
        }>;
    }>;
    contents?: Array<{
        role: string;
        parts: Array<{
            text: string;
        }>;
    }>;
    generationConfig?: Record<string, any>;
    safetySettings?: Array<any>;
    toolName?: string;
}
/**
 * Interface for SDK request format
 */
export interface SdkRequest {
    contents: Array<{
        role: string;
        parts: Array<{
            text: string;
        }>;
    }>;
    systemInstruction?: string;
    generationConfig?: Record<string, any>;
    safetySettings?: Array<any>;
    toolName?: string;
    modelId?: string;
    file_path?: string | string[];
    file_context?: string | string[];
    directory_path?: string;
}
/**
 * Interface for search request options
 */
interface SearchRequestOptions {
    query: string;
    modelId?: string;
    filePath?: string | string[];
    enableThinking?: boolean;
    toolName?: string;
}
/**
 * Interface for reasoning request options
 */
interface ReasoningRequestOptions {
    problem: string;
    modelId?: string;
    filePath?: string | string[];
    showSteps?: boolean;
    toolName?: string;
}
/**
 * Interface for processing request options (legacy)
 */
interface ProcessingRequestOptions {
    content?: string;
    filePath?: string | string[];
    operation?: string;
    modelId?: string;
    toolName?: string;
}
/**
 * Interface for analysis request options (legacy)
 */
interface AnalysisRequestOptions {
    filePath: string | string[];
    instruction?: string;
    modelId?: string;
    toolName?: string;
}
/**
 * Build a Gemini API request
 * @param {InternalRequest} internal - Internal request format
 * @returns {SdkRequest} - SDK request format
 */
export declare function buildRequest(internal: InternalRequest): SdkRequest;
/**
 * Build a Gemini API request for searching
 * @param {SearchRequestOptions} options - Search options
 * @returns {SdkRequest} - Gemini API request body
 */
export declare function buildSearchRequest(options: SearchRequestOptions): SdkRequest;
/**
 * Build a Gemini API request for reasoning
 * @param {ReasoningRequestOptions} options - Reasoning options
 * @returns {SdkRequest} - Gemini API request body
 */
export declare function buildReasoningRequest(options: ReasoningRequestOptions): SdkRequest;
/**
 * Build a Gemini API request for processing
 * @param {ProcessingRequestOptions} options - Processing options
 * @returns {SdkRequest} - Gemini API request body
 */
export declare function buildProcessingRequest(options: ProcessingRequestOptions): SdkRequest;
/**
 * Build a Gemini API request for file analysis
 * @param {AnalysisRequestOptions} options - Analysis options
 * @returns {SdkRequest} - Gemini API request body
 */
export declare function buildAnalysisRequest(options: AnalysisRequestOptions): SdkRequest;
/**
 * Build a Gemini API request for code analysis
 * @param {CodeArgs} args - Code analysis arguments
 * @returns {SdkRequest} - Gemini API request body
 */
export declare function buildCodeRequest(args: CodeArgs): Promise<SdkRequest>;
/**
 * Build a Gemini API request for file operations
 * @param {FileopsArgs} args - File operations arguments
 * @returns {SdkRequest} - Gemini API request body
 */
export declare function buildFileopsRequest(args: FileopsArgs): SdkRequest;
export {};
