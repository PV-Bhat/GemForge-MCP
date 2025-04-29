/**
 * Handler for gemini_fileops tool
 *
 * This file contains the implementation of the gemini_fileops tool,
 * which performs efficient operations on files using appropriate Gemini models.
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_NAMES } from '../config/constants.js';
import { buildFileopsRequest } from '../utils/request-builder.js';
import { executeRequest } from '../utils/api-executor.js';
import { fileExists, isLargeFile, getFileTypeCategory, concatenateFiles } from '../utils/file-handler.js';
import { formatResponse } from '../utils/response-formatter.js';
import { selectToolModel } from '../utils/model-selector.js';
import path from 'path';
/**
 * Handle Gemini file operations request
 * @param request - MCP request
 * @returns MCP response
 */
export async function handleFileops(request) {
    try {
        // Validate required parameters
        if (!request.params.arguments || !request.params.arguments.file_path) {
            throw new McpError(ErrorCode.InvalidParams, 'file_path parameter is required');
        }
        // Extract arguments as FileopsArgs
        const args = request.params.arguments;
        const { file_path, instruction, operation, use_large_context_model = false, model_id } = args;
        // Validate file_path
        if (typeof file_path !== 'string' && !Array.isArray(file_path)) {
            throw new McpError(ErrorCode.InvalidParams, 'file_path must be a string or array of strings');
        }
        // Handle file path validation for both single files and arrays
        if (Array.isArray(file_path)) {
            console.error(`[handleFileops] Checking if files exist: ${JSON.stringify(file_path)}`);
            // Validate each file in the array
            const validatedPaths = [];
            for (const path of file_path) {
                console.error(`[handleFileops] Checking file: ${path}`);
                const exists = await fileExists(path);
                if (!exists) {
                    throw new McpError(ErrorCode.InvalidParams, `File not found: ${path}`);
                }
                validatedPaths.push(path);
            }
            console.error(`[handleFileops] All files exist and are accessible`);
            // If we have multiple files, create a temporary file with their contents
            if (validatedPaths.length > 1) {
                console.error(`[handleFileops] Processing multiple files: ${validatedPaths.length}`);
                try {
                    // Concatenate all files into a single temporary file
                    const tempFilePath = await concatenateFiles(validatedPaths);
                    console.error(`[handleFileops] Created temporary file with concatenated content: ${tempFilePath}`);
                    // Update the file_path to use the temporary file
                    args.file_path = tempFilePath;
                    // Add a note about the original files
                    if (!args.instruction) {
                        args.instruction = "";
                    }
                    args.instruction = `This is a combined file containing the contents of ${validatedPaths.length} files: ${validatedPaths.map(p => path.basename(p)).join(", ")}.\n\n${args.instruction}`;
                }
                catch (error) {
                    console.error(`[handleFileops] Error concatenating files:`, error);
                    throw new McpError(ErrorCode.InternalError, `Error processing multiple files: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
        else {
            // Single file path
            console.error(`[handleFileops] Checking if file exists: ${file_path}`);
            const exists = await fileExists(file_path);
            if (!exists) {
                throw new McpError(ErrorCode.InvalidParams, `File not found: ${file_path}`);
            }
        }
        // Determine file type for logging (use first file if array)
        const firstFilePath = Array.isArray(file_path) ? file_path[0] : file_path;
        const fileType = getFileTypeCategory(firstFilePath);
        console.error(`[handleFileops] File type: ${fileType}`);
        // Select the model using the tool-specific model selector
        const targetModelId = selectToolModel(TOOL_NAMES.GEM_FILEOPS, args);
        console.error(`[handleFileops] Selected model: ${targetModelId}`);
        // Build request using the new builder function
        const internalRequest = await buildFileopsRequest(args);
        console.error(`[handleFileops] Request built for model: ${targetModelId}`);
        // Explicitly load file content using preparePartsWithFiles
        try {
            const { preparePartsWithFiles } = await import('../utils/file-handler.js');
            // Get the instruction text from the first user message
            let instructionText = '';
            const userMsgIndex = internalRequest.contents.findIndex((c) => c.role === 'user');
            if (userMsgIndex >= 0 && internalRequest.contents[userMsgIndex].parts.length > 0) {
                instructionText = internalRequest.contents[userMsgIndex].parts[0].text || '';
            }
            console.error(`[handleFileops] Explicitly loading file content for: ${typeof file_path === 'string' ? file_path : JSON.stringify(file_path)}`);
            const parts = await preparePartsWithFiles(file_path, instructionText);
            console.error(`[handleFileops] Successfully loaded ${parts.length} parts`);
            // Replace the parts in the user message with our explicitly loaded parts
            if (userMsgIndex >= 0) {
                // Need to cast parts to any to avoid TypeScript errors
                internalRequest.contents[userMsgIndex].parts = parts;
                console.error(`[handleFileops] Replaced parts in user message at index ${userMsgIndex}`);
            }
            else if (internalRequest.contents.length > 0) {
                // If no user message found but we have contents, replace the first message
                internalRequest.contents[0].parts = parts;
                console.error(`[handleFileops] Replaced parts in first message`);
            }
        }
        catch (error) {
            console.error(`[handleFileops] Error explicitly loading file content:`, error);
            // Continue with the original request if there's an error
        }
        try {
            // Execute request
            const { response, rawSdkResponse } = await executeRequest(targetModelId, internalRequest);
            console.error(`[handleFileops] Got response from ${targetModelId}`);
            // Format response
            return formatResponse(response, targetModelId, {
                operation: TOOL_NAMES.GEM_FILEOPS,
                processingType: operation || 'analyze',
                withFile: true,
                fileType: fileType,
                isImageFile: fileType === 'image',
                customFormat: {
                    usedLargeContext: use_large_context_model === true
                }
            }, rawSdkResponse);
        }
        catch (apiError) {
            console.error('[handleFileops] API error:', apiError);
            if (apiError instanceof McpError) {
                throw apiError;
            }
            // For large files, try falling back to 1.5 model if not already using it
            if (isLargeFile(file_path) && targetModelId !== 'gemini-1.5-pro') {
                console.error('[handleFileops] Large file detected, retrying with gemini-1.5-pro...');
                // Create a new args object with large context model flag set to true
                const fallbackArgs = {
                    ...args,
                    use_large_context_model: true
                };
                // Build a new request with the fallback model
                const fallbackRequest = buildFileopsRequest(fallbackArgs);
                fallbackRequest.modelId = 'gemini-1.5-pro';
                const { response, rawSdkResponse } = await executeRequest('gemini-1.5-pro', fallbackRequest);
                return formatResponse(response, 'gemini-1.5-pro', {
                    operation: TOOL_NAMES.GEM_FILEOPS,
                    processingType: operation || 'analyze',
                    withFile: true,
                    fileType: fileType,
                    isImageFile: fileType === 'image',
                    customFormat: {
                        usedLargeContext: true,
                        fallbackModel: true
                    }
                }, rawSdkResponse);
            }
            throw apiError;
        }
    }
    catch (error) {
        console.error('Error in fileops handler:', error);
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
//# sourceMappingURL=fileops.js.map