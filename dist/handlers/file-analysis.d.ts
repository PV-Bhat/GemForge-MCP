/**
 * Interface for file analysis arguments
 */
export interface AnalyzeFileArgs {
    /** Path to the file to analyze */
    file_path: string;
    /** Optional specific question about the file */
    query?: string;
    /** Optional model ID override */
    modelId?: string;
}
/**
 * Interface for multiple file analysis arguments
 */
export interface AnalyzeFilesArgs {
    /** Paths to the files to analyze */
    file_paths: string[];
    /** Optional specific question about the files */
    query?: string;
    /** Optional model ID override */
    modelId?: string;
}
/**
 * Handles file analysis requests
 * @param request The MCP request
 * @returns The MCP response
 */
export declare function handleAnalyzeFile(request: any): Promise<any>;
/**
 * Handles multiple file analysis requests
 * @param request The MCP request
 * @returns The MCP response
 */
export declare function handleAnalyzeFiles(request: any): Promise<any>;
