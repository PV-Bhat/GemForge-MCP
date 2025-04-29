/**
 * API execution utilities for Gemini API
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { transformFromSdkResponse } from './sdk-mapper.js';
import { TOOL_NAMES } from '../config/constants.js';
// API configuration
const API_KEY = process.env.GEMINI_API_KEY || '';
// Log API key status (without revealing the full key)
if (!API_KEY) {
    console.error('[api-executor] ERROR: No GEMINI_API_KEY found in environment variables');
}
else {
    const keyPreview = API_KEY.substring(0, 5) + '...' + API_KEY.substring(API_KEY.length - 5);
    console.error(`[api-executor] Using API key: ${keyPreview}`);
}
// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);
/**
 * Execute a request using the Google Generative AI SDK
 * @param modelId - Model ID to use
 * @param sdkPayload - Pre-built SDK payload
 * @param isRetry - Whether this is a retry attempt
 * @returns Response from the API
 */
export async function executeRequest(modelId, sdkPayload, isRetry = false) {
    try {
        console.error(`[executeRequest] Executing request for model: ${modelId}`);
        const model = genAI.getGenerativeModel({ model: modelId });
        // Ensure modelId is set in the request
        sdkPayload.modelId = modelId;
        // Use the pre-built SDK payload directly, do not rebuild
        const req = sdkPayload;
        console.error(`[executeRequest] Using pre-built SDK payload for model: ${modelId}`);
        // Add debug log to catch regressions quick
        console.error('[executeRequest] Debug info: ' + JSON.stringify({
            model: req.modelId,
            systemInstruction: !!req.systemInstruction,
            roles: req.contents.map((c) => c.role)
        }));
        // Log the full request for debugging
        console.error('[executeRequest] Full request for ' + modelId + ': ' + JSON.stringify({
            contents: req.contents,
            systemInstruction: req.systemInstruction,
            tools: req.toolName === 'gemini_search' ? [{ googleSearch: {} }] : undefined,
            generationConfig: req.generationConfig,
            safetySettings: req.safetySettings,
            file_path: req.file_path,
            file_context: req.file_context,
            directory_path: req.directory_path
        }));
        // Log detailed information about contents
        console.error('[executeRequest] Request details: ' + JSON.stringify({
            model: req.modelId,
            systemInstruction: !!req.systemInstruction,
            roles: req.contents.map((c) => c.role),
            partCounts: req.contents.map((c) => c.parts.length),
            partTypes: req.contents.map((c) => c.parts.map((p) => Object.keys(p).join('/')))
        }));
        // Check if we have a file_path for code analysis
        if (req.file_path && req.toolName === 'gemini_code') {
            console.error(`[executeRequest] Code analysis with file_path: ${typeof req.file_path === 'string' ? req.file_path : JSON.stringify(req.file_path)}`);
            // Check if the file exists
            try {
                const fs = require('fs');
                if (Array.isArray(req.file_path)) {
                    // Handle array of file paths
                    console.error(`[executeRequest] Checking array of ${req.file_path.length} files`);
                    for (const path of req.file_path) {
                        if (fs.existsSync(path)) {
                            const stats = fs.statSync(path);
                            console.error(`[executeRequest] File exists: ${path}, size: ${stats.size} bytes`);
                        }
                        else {
                            console.error(`[executeRequest] File does not exist: ${path}`);
                        }
                    }
                }
                else {
                    // Handle single file path
                    if (fs.existsSync(req.file_path)) {
                        const stats = fs.statSync(req.file_path);
                        console.error(`[executeRequest] File exists, size: ${stats.size} bytes`);
                    }
                    else {
                        console.error(`[executeRequest] File does not exist: ${req.file_path}`);
                    }
                }
            }
            catch (error) {
                console.error(`[executeRequest] Error checking file: ${error}`);
            }
        }
        // Log the XML length to verify it's being sent
        console.error(`[DEBUG] xml length: ${req.contents
            .flatMap((c) => c.parts)
            .reduce((n, p) => n + (p.text?.length ?? 0), 0)} chars`);
        // Log the final SDK payload right before the API call
        console.error('[executeRequest] FINAL SDK PAYLOAD: ' + JSON.stringify({
            contents: req.contents.map((c) => ({
                role: c.role,
                parts: c.parts.map((p) => {
                    if (p.text) {
                        return { text: p.text.length > 100 ? `${p.text.substring(0, 100)}...` : p.text };
                    }
                    else if (p.inlineData) {
                        return { inlineData: { mimeType: p.inlineData.mimeType, data: '(base64 data)' } };
                    }
                    else if (p.fileData) {
                        return { fileData: { mimeType: p.fileData.mimeType, fileUri: p.fileData.fileUri } };
                    }
                    else {
                        return p;
                    }
                }),
                partTypes: c.parts.map((p) => Object.keys(p).join('/'))
            })),
            systemInstruction: req.systemInstruction ? '(system instruction present)' : undefined,
            tools: req.toolName === 'gemini_search' ? [{ googleSearch: {} }] : undefined,
            generationConfig: req.generationConfig,
            safetySettings: req.safetySettings
        }));
        // Dump the exact payload that goes over the wire
        console.error('[PAYLOAD] ' + JSON.stringify({
            parts: req.contents?.[0]?.parts.length,
            preview0: req.contents?.[0]?.parts?.[0]?.text?.slice(0, 60),
            preview1: req.contents?.[0]?.parts?.[1]?.text?.slice(0, 60),
            hasInlineData: req.contents?.[0]?.parts.some((p) => p.inlineData),
            hasFileData: req.contents?.[0]?.parts.some((p) => p.fileData),
            partTypes: req.contents?.[0]?.parts.map((p) => Object.keys(p).join('/'))
        }));
        // Check for token truncation
        if (req.contents?.[0]?.parts?.[1]?.text) {
            console.error('[PAYLOAD] ' + JSON.stringify({
                last10KLen: req.contents[0].parts[1].text.slice(-10000).length
            }));
        }
        // Process file_context if present but not already in contents
        if (req.file_context || req.file_path) {
            // Always process file content for fileops, even if we think it might already be in contents
            const forceProcessing = req.toolName === TOOL_NAMES.GEM_FILEOPS;
            const hasFilePartsInContents = req.contents.some((c) => c.parts.some((p) => p.inlineData || p.fileData));
            if (forceProcessing || !hasFilePartsInContents) {
                console.error(`[executeRequest] File context found${forceProcessing ? ' (forced processing for fileops)' : ''}, processing now`);
                // Import the transformToSdkFormat function to process file content
                const { transformToSdkFormat } = await import('./sdk-mapper.js');
                // Create a temporary request with just the file context
                const tempRequest = {
                    file_context: req.file_context || req.file_path
                };
                // Process the file context to get parts with file content
                const processedRequest = await transformToSdkFormat(tempRequest, modelId);
                // If we got processed parts with file content, add them to the user message
                if (processedRequest.contents &&
                    processedRequest.contents[0] &&
                    processedRequest.contents[0].parts &&
                    processedRequest.contents[0].parts.length > 0) {
                    // Get file parts (skip any text parts that might be there)
                    const fileParts = processedRequest.contents[0].parts.filter(p => p.inlineData || p.fileData);
                    if (fileParts.length > 0) {
                        console.error(`[executeRequest] Found ${fileParts.length} file parts to add to request`);
                        // Add file parts to the first user message
                        const userMsgIndex = req.contents.findIndex((c) => c.role === 'user');
                        if (userMsgIndex >= 0) {
                            req.contents[userMsgIndex].parts.push(...fileParts);
                            console.error(`[executeRequest] Added file parts to user message at index ${userMsgIndex}`);
                            // Log the first file part for debugging
                            const firstFilePart = fileParts[0];
                            if (firstFilePart.inlineData) {
                                console.error(`[executeRequest] First file part is inlineData with mimeType: ${firstFilePart.inlineData.mimeType}, data length: ${firstFilePart.inlineData.data?.length || 0}`);
                            }
                            else if (firstFilePart.fileData) {
                                console.error(`[executeRequest] First file part is fileData with mimeType: ${firstFilePart.fileData.mimeType}, fileUri: ${firstFilePart.fileData.fileUri}`);
                            }
                        }
                        else if (req.contents.length > 0) {
                            // If no user message found but we have contents, add to the first message
                            req.contents[0].parts.push(...fileParts);
                            console.error(`[executeRequest] Added file parts to first message`);
                        }
                    }
                    else {
                        console.error(`[executeRequest] No file parts found in processed request`);
                    }
                }
                else {
                    console.error(`[executeRequest] No valid contents found in processed request`);
                }
            }
            else {
                console.error(`[executeRequest] File parts already present in contents, skipping processing`);
            }
        }
        // Send request to Gemini API with the new approach
        const result = await model.generateContent({
            contents: req.contents, // must be only 'user' messages
            systemInstruction: req.systemInstruction, // Flash-safe preamble
            tools: req.toolName === 'gemini_search'
                ? [{ googleSearch: {} }] // correct Node.js SDK shape
                : undefined,
            generationConfig: req.generationConfig,
            safetySettings: req.safetySettings
        });
        const sdkResponse = result.response;
        console.error(`[executeRequest] SDK Response received from ${modelId}`);
        // Transform SDK response to internal format
        const internalResponse = transformFromSdkResponse(sdkResponse);
        // Add model information to the response
        internalResponse.modelUsed = modelId;
        // Return both the internal response and raw SDK response
        return { response: internalResponse, rawSdkResponse: sdkResponse };
    }
    catch (error) {
        console.error(`[executeRequest] API call failed for model ${modelId}:`, error);
        // Error handling
        if (error instanceof Error) {
            const errorMessage = error.message || '';
            const errorCode = error.code || error.status || '';
            console.error(`[executeRequest] Error code: ${errorCode}, message: ${errorMessage}`);
            // Rate limit error
            if (errorCode === 429 || /rate limit/i.test(errorMessage)) {
                // If this is a 2.5 Pro model and not already a retry, try with 2.5 Flash
                if (!isRetry && modelId.includes('2.5-pro')) {
                    console.error(`[executeRequest] Rate limit for ${modelId}, retrying with 2.5 Flash model`);
                    // Use 2.5 Flash as fallback
                    const fallbackModelId = 'gemini-2.5-flash-preview-04-17';
                    return executeRequest(fallbackModelId, sdkPayload, true);
                }
                throw new McpError(ErrorCode.InvalidParams, `Rate limit exceeded for ${modelId}. Please try again later.`);
            }
            // Model not found error
            if (errorMessage.includes('not found') || errorCode === 404) {
                throw new McpError(ErrorCode.InvalidParams, `Model ${modelId} not found or not supported. Please try a different model.`);
            }
            // Permission error
            if (errorMessage.includes('permission') || errorCode === 403) {
                throw new McpError(ErrorCode.InvalidParams, `Permission denied for ${modelId}. Check your API key and permissions.`);
            }
            // Bad request error
            if (errorCode === 400 ||
                errorMessage.toLowerCase().includes('bad request') ||
                errorMessage.includes('Unknown name "tools"')) {
                throw new McpError(ErrorCode.InvalidParams, `Bad request for ${modelId}: ${errorMessage}`);
            }
        }
        // Generic error fallback
        throw new McpError(ErrorCode.InternalError, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
//# sourceMappingURL=api-executor.js.map