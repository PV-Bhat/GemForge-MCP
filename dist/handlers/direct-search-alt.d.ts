/**
 * Handle Gemini search request directly without using system roles
 * @param request - MCP request
 * @returns MCP response
 */
export declare function handleDirectSearchAlt(request: any): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
