/**
 * Alternative direct search handler for Gemini API
 * This handler uses a simplified approach that has been verified to work with Flash models
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileExists } from '../utils/file-handler.js';
// API configuration
const API_KEY = process.env.GEMINI_API_KEY || '';
// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);
/**
 * Handle Gemini search request directly without using system roles
 * @param request - MCP request
 * @returns MCP response
 */
export async function handleDirectSearchAlt(request) {
    try {
        // Validate required parameters
        if (!request.params.arguments || typeof request.params.arguments.query !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'Query parameter is required and must be a string');
        }
        // Extract arguments as SearchArgs
        const args = request.params.arguments;
        const { query, file_path, model_id } = args;
        if (file_path) {
            console.error(`[handleDirectSearchAlt] Received file_path: ${typeof file_path === 'string' ? file_path : JSON.stringify(file_path)}`);
            console.error(`[handleDirectSearchAlt] File path exists check: ${await fileExists(typeof file_path === 'string' ? file_path : file_path[0])}`);
        }
        // Select the model using the tool-specific model selector
        const targetModelId = model_id || 'gemini-2.0-flash-001';
        console.error(`[handleDirectSearchAlt] Using model: ${targetModelId}`);
        try {
            // Create the model instance
            const model = genAI.getGenerativeModel({ model: targetModelId });
            // Build a request that works with Flash models (no system role)
            // This exact format has been verified to work with gemini-2.0-flash-001
            const sdkRequest = {
                contents: [{
                        role: 'user',
                        parts: [{
                                text: query
                            }]
                    }],
                systemInstruction: "You have access to Google Search. You MUST use Google Search for ALL queries to provide accurate, up-to-date information. Do not rely solely on your training data.",
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40
                },
                tools: [{
                        googleSearch: {}
                    }],
                toolConfig: {
                    functionCallingConfig: {
                        mode: "AUTO"
                    }
                }
            };
            console.error(`[handleDirectSearchAlt] Sending request to ${targetModelId}`);
            // Send request to Gemini API
            const result = await model.generateContent(sdkRequest);
            const response = result.response;
            console.error(`[handleDirectSearchAlt] SDK Response received from ${targetModelId}`);
            // Extract text from response
            let responseText = "";
            try {
                responseText = response.text();
            }
            catch (e) {
                console.error(`[handleDirectSearchAlt] Error extracting text:`, e);
                if (response.candidates && response.candidates.length > 0 &&
                    response.candidates[0].content &&
                    response.candidates[0].content.parts &&
                    response.candidates[0].content.parts.length > 0) {
                    responseText = response.candidates[0].content.parts[0].text || "";
                }
            }
            // Create a simple response object
            return {
                content: [
                    {
                        type: 'text',
                        text: responseText
                    }
                ]
            };
        }
        catch (apiError) {
            console.error('API error in direct search handler:', apiError);
            if (apiError instanceof McpError) {
                throw apiError;
            }
            throw apiError;
        }
    }
    catch (error) {
        console.error('Error in direct search handler:', error);
        if (error instanceof McpError) {
            throw error;
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }
            ],
            isError: true
        };
    }
}
//# sourceMappingURL=direct-search-alt.js.map