/**
 * Handler for gemini_code tool
 *
 * This file contains the implementation of the gemini_code tool,
 * which analyzes codebases using Repomix and Gemini 2.5 Pro.
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_NAMES } from '../config/constants.js';
import { packDirectory, cleanupPackedFile } from '../utils/repo-packer.js';
import { buildCodeRequest } from '../utils/request-builder.js';
import { executeRequest } from '../utils/api-executor.js';
import { formatResponse } from '../utils/response-formatter.js';
import { selectToolModel } from '../utils/model-selector.js';
import fs from 'fs/promises';
import path from 'path';
/**
 * Handle Gemini code analysis request
 * @param request - MCP request
 * @returns MCP response
 */
export async function handleCode(request) {
    // --> ADD THIS LINE <--
    console.error('<<<<< RUNNING LATEST handleCode - FIX_ATTEMPT_4 >>>>>');
    let tempFilePath = null;
    try {
        // Validate required parameters
        if (!request.params.arguments || !request.params.arguments.question) {
            throw new McpError(ErrorCode.InvalidParams, 'question parameter is required');
        }
        // Extract arguments
        const args = request.params.arguments;
        const { question, directory_path, codebase_path, model_id, repomix_options } = args;
        // Validate that at least one of directory_path or codebase_path is provided
        if (!directory_path && !codebase_path) {
            throw new McpError(ErrorCode.InvalidParams, 'Either directory_path or codebase_path parameter is required');
        }
        // Determine the analysis path
        let analysisPath;
        if (codebase_path) {
            // Use the provided codebase path
            console.error(`[handleCode] Using provided codebase path: ${codebase_path}`);
            // Normalize the path for Windows
            const normalizedPath = path.resolve(codebase_path);
            console.error(`[handleCode] Normalized codebase path: ${normalizedPath}`);
            // Check if the file exists
            try {
                await fs.access(normalizedPath);
                console.error(`[handleCode] File exists at: ${normalizedPath}`);
                analysisPath = normalizedPath;
            }
            catch (error) {
                console.error(`[handleCode] File access error: ${error}`);
                throw new McpError(ErrorCode.InvalidParams, `Codebase file not found: ${codebase_path} (normalized: ${normalizedPath})`);
            }
        }
        else {
            // Pack the directory using Repomix
            console.error(`[handleCode] Packing directory: ${directory_path}`);
            if (!directory_path) {
                throw new McpError(ErrorCode.InvalidParams, 'directory_path is required for packing');
            }
            // Normalize the directory path for Windows
            const normalizedDirPath = path.resolve(directory_path);
            console.error(`[handleCode] Normalized directory path: ${normalizedDirPath}`);
            // Pack the directory with custom options if provided
            const packOptions = repomix_options ? { customOptions: repomix_options } : {};
            console.error(`[handleCode] Calling packDirectory with${repomix_options ? ' custom options: ' + repomix_options : ''}: ${normalizedDirPath}`);
            const packResult = await packDirectory(normalizedDirPath, packOptions);
            console.error(`[handleCode] Pack result: ${JSON.stringify(packResult)}`);
            if (packResult.error) {
                console.error(`[handleCode] Pack error: ${packResult.error}`);
                throw new McpError(ErrorCode.InternalError, `Failed to pack directory: ${packResult.error}`);
            }
            analysisPath = packResult.outputPath;
            tempFilePath = analysisPath; // Store for cleanup
            console.error(`[handleCode] Directory packed successfully: ${analysisPath}`);
            // Verify the file exists
            try {
                await fs.access(analysisPath);
                console.error(`[handleCode] Packed file exists at: ${analysisPath}`);
            }
            catch (error) {
                console.error(`[handleCode] Packed file access error: ${error}`);
                throw new McpError(ErrorCode.InternalError, `Packed file not found: ${analysisPath}`);
            }
        }
        // Create a new args object with the updated codebase_path
        const updatedArgs = {
            ...args,
            codebase_path: analysisPath
        };
        // Select the model using the tool-specific model selector
        const targetModelId = selectToolModel(TOOL_NAMES.GEM_CODE, updatedArgs);
        console.error(`[handleCode] Selected model: ${targetModelId}`);
        // Build the request using the new builder function
        const internalRequest = await buildCodeRequest(updatedArgs);
        console.error(`[handleCode] Request built for model: ${targetModelId}`);
        // Diagnostic: log contents to verify XML is included
        console.error(`[handleCode] SDK request contents: ${internalRequest.contents.length} entries`);
        if (internalRequest.contents[0]?.parts) {
            console.error(`[handleCode] First part length: ${internalRequest.contents[0].parts[0].text.length} chars`);
        }
        // Execute the request
        const { response, rawSdkResponse } = await executeRequest(targetModelId, internalRequest);
        console.error(`[handleCode] Got response from ${targetModelId}`);
        // Format the response
        return formatResponse(response, targetModelId, {
            operation: TOOL_NAMES.GEM_CODE,
            customFormat: {
                question,
                usedDirectory: !!directory_path,
                usedCodebasePath: !!codebase_path
            }
        }, rawSdkResponse);
    }
    catch (error) {
        console.error('Error in code handler:', error);
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
    finally {
        // Clean up temporary files if created
        if (tempFilePath) {
            try {
                await cleanupPackedFile(tempFilePath);
            }
            catch (cleanupError) {
                console.error(`[handleCode] Error cleaning up temporary file: ${cleanupError}`);
            }
        }
    }
}
//# sourceMappingURL=code.js.map