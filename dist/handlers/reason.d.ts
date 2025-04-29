/**
 * Interface for reasoning arguments
 */
export interface ReasonArgs {
    /** The problem to reason about */
    problem: string;
    /** Whether to show reasoning steps */
    showSteps?: boolean;
    /** Optional model ID override */
    modelId?: string;
}
/**
 * Handles complex reasoning operations
 * @param request The MCP request
 * @returns The MCP response
 */
export declare function handleReason(request: any): Promise<any>;
