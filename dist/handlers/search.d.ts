/**
 * Interface for search arguments
 */
export interface SearchArgs {
    /** The search query */
    query: string;
    /** Optional model ID override */
    modelId?: string;
    /** Whether to enable thinking mode */
    enableThinking?: boolean;
    /** Whether this is a high-volume search operation */
    highVolume?: boolean;
}
/**
 * Handles the standard search operation
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
export declare function handleSearch(request: any): Promise<any>;
/**
 * Handles the rapid search operation (optimized for high volume)
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
export declare function handleRapidSearch(request: any): Promise<any>;
