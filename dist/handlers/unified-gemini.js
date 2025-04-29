/**
 * Unified handler for Gemini search and reasoning operations
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_NAMES } from '../config/constants.js';
import { selectToolModel, MODELS } from '../utils/model-selector.js';
import { buildSearchRequest, buildReasoningRequest, buildProcessingRequest, buildAnalysisRequest } from '../utils/request-builder.js';
import { executeRequest } from '../utils/api-executor.js';
import { fileExists, isLargeFile, getFileTypeCategory } from '../utils/file-handler.js';
import { formatResponse } from '../utils/response-formatter.js';
// Using the imported formatResponse function from response-formatter.js
/**
 * Handle Gemini process (content/file processing) request
 * @param request - MCP request
 * @returns MCP response
 */
export async function handleProcess(request) {
    try {
        if (!request.params.arguments) {
            throw new McpError(ErrorCode.InvalidParams, 'Arguments are required for process handler');
        }
        const { content = '', file_path, operation = 'analyze', model_id } = request.params.arguments;
        const modelId = model_id || MODELS.FLASH_LITE;
        const internal = await buildProcessingRequest({ content, filePath: file_path, operation, modelId });
        const { response, rawSdkResponse } = await executeRequest(modelId, internal);
        return formatResponse(response, modelId, {
            // Use GEM_FILEOPS for process operations (fileops)
            operation: TOOL_NAMES.GEM_FILEOPS,
            processingType: operation,
            withFile: !!file_path
        }, rawSdkResponse);
    }
    catch (error) {
        console.error('Error in process handler:', error);
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
/**
 * Handle Gemini file analysis request
 * @param request - MCP request
 * @returns MCP response
 */
export async function handleAnalyze(request) {
    try {
        if (!request.params.arguments || !request.params.arguments.file_path) {
            throw new McpError(ErrorCode.InvalidParams, 'file_path parameter is required for analyze handler');
        }
        const { file_path, instruction, model_id } = request.params.arguments;
        // Use TOOL_NAMES.ANALYZE_FILE instead of TOOL_NAMES.GEM_ANALYZE
        const selectedModelId = model_id || selectToolModel(TOOL_NAMES.ANALYZE_FILE, { filePath: file_path });
        const internal = await buildAnalysisRequest({ filePath: file_path, instruction, modelId: selectedModelId });
        const { response, rawSdkResponse } = await executeRequest(selectedModelId, internal);
        return formatResponse(response, selectedModelId, {
            // Use ANALYZE_FILE for gemini_analyze
            operation: TOOL_NAMES.ANALYZE_FILE,
            fileType: Array.isArray(file_path) ? 'multiple files' : getFileTypeCategory(file_path)
        }, rawSdkResponse);
    }
    catch (error) {
        console.error('Error in analyze handler:', error);
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
/**
 * Handle Gemini search request
 * @param request - MCP request
 * @returns MCP response
 */
export async function handleSearch(request) {
    try {
        // Validate required parameters
        if (!request.params.arguments || typeof request.params.arguments.query !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'Query parameter is required and must be a string');
        }
        // Extract arguments as SearchArgs
        const args = request.params.arguments;
        const { query, file_path, model_id, enable_thinking } = args;
        if (file_path) {
            console.error(`[handleSearch] Received file_path: ${typeof file_path === 'string' ? file_path : JSON.stringify(file_path)}`);
            console.error(`[handleSearch] File path exists check: ${await fileExists(typeof file_path === 'string' ? file_path : file_path[0])}`);
        }
        // Select the model using the tool-specific model selector
        const targetModelId = selectToolModel(TOOL_NAMES.GEM_SEARCH, args);
        console.error(`[handleSearch] Selected model: ${targetModelId}`);
        // Build request with available parameters
        const internalRequest = await buildSearchRequest({
            query,
            modelId: targetModelId,
            filePath: file_path,
            toolName: TOOL_NAMES.GEM_SEARCH
        });
        try {
            // Execute request with selected model and get both response and raw SDK response
            const { response, rawSdkResponse } = await executeRequest(targetModelId, internalRequest);
            console.error(`[handleSearch] Got response from ${targetModelId}, has rawSdkResponse: ${!!rawSdkResponse}`);
            // Format response with the raw SDK response included
            return formatResponse(response, targetModelId, {
                operation: TOOL_NAMES.GEM_SEARCH,
                withFile: !!file_path,
                thinking: enable_thinking
            }, rawSdkResponse);
        }
        catch (apiError) {
            console.error('API error in search handler:', apiError);
            if (apiError instanceof McpError) {
                throw apiError;
            }
            // For multimodal search errors, try falling back to a vision model
            if (file_path && (!model_id || model_id.includes('flash'))) {
                console.error('Retrying with gemini-1.5-pro-vision...');
                const { response, rawSdkResponse } = await executeRequest('gemini-1.5-pro-vision', {
                    ...internalRequest,
                    model_id: 'gemini-1.5-pro-vision'
                });
                return formatResponse(response, 'gemini-1.5-pro-vision', {
                    operation: TOOL_NAMES.GEM_SEARCH,
                    withFile: !!file_path,
                    thinking: enable_thinking
                }, rawSdkResponse);
            }
            throw apiError;
        }
    }
    catch (error) {
        console.error('Error in search handler:', error);
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
/**
 * Handle Gemini reasoning request
 * @param request - MCP request
 * @returns MCP response
 */
export async function handleReason(request) {
    try {
        // Validate required parameters
        if (!request.params.arguments || typeof request.params.arguments.problem !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'Problem parameter is required and must be a string');
        }
        // Extract arguments as ReasonArgs
        const args = request.params.arguments;
        const { problem, file_path, model_id, show_steps = true } = args;
        // Select the model using the tool-specific model selector
        const targetModelId = selectToolModel(TOOL_NAMES.GEM_REASON, args);
        console.error(`[handleReason] Selected model: ${targetModelId}`);
        // Build request with available parameters
        const internalRequest = await buildReasoningRequest({
            problem,
            modelId: targetModelId,
            filePath: file_path,
            showSteps: show_steps,
            toolName: TOOL_NAMES.GEM_REASON
        });
        try {
            // Execute request with selected model and get both response and raw SDK response
            const { response, rawSdkResponse } = await executeRequest(targetModelId, internalRequest);
            console.error(`[handleReason] Got response from ${targetModelId}, has rawSdkResponse: ${!!rawSdkResponse}`);
            // Format response with the raw SDK response included
            return formatResponse(response, targetModelId, {
                operation: TOOL_NAMES.GEM_REASON,
                withFile: !!file_path,
                showSteps: show_steps
            }, rawSdkResponse);
        }
        catch (apiError) {
            console.error('API error in reasoning handler:', apiError);
            if (apiError instanceof McpError) {
                throw apiError;
            }
            // For large files only, try falling back to 1.5 model
            if (file_path && isLargeFile(file_path) && !targetModelId.includes('1.5-pro')) {
                console.error('Large file detected, retrying with gemini-1.5-pro...');
                const { response, rawSdkResponse } = await executeRequest('gemini-1.5-pro', {
                    ...internalRequest,
                    model_id: 'gemini-1.5-pro'
                });
                return formatResponse(response, 'gemini-1.5-pro', {
                    operation: TOOL_NAMES.GEM_REASON,
                    withFile: !!file_path,
                    showSteps: show_steps
                }, rawSdkResponse);
            }
            throw apiError;
        }
    }
    catch (error) {
        console.error('Error in reasoning handler:', error);
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
//# sourceMappingURL=unified-gemini.js.map