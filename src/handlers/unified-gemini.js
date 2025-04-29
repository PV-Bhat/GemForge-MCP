"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};


export { handleSearch, handleReason, handleProcess, handleAnalyze, TOOL_NAMES };
/**
 * Unified handler for all Gemini API operations
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as types_js_1 from "@modelcontextprotocol/sdk/types.js";
import * as model_selector_js_1 from "../utils/model-selector.js";
import * as request_builder_js_1 from "../utils/request-builder.js";
import * as file_handler_js_1 from "../utils/file-handler.js";
// API configuration
var API_KEY = process.env.GEMINI_API_KEY || '';
// Initialize the Google Generative AI client
var genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
// Tool names
export const TOOL_NAMES = {
    GEM_SEARCH: 'gemini_search',
    GEM_REASON: 'gemini_reason',
    GEM_PROCESS: 'gemini_process',
    GEM_ANALYZE: 'gemini_analyze'
};
/**
 * Execute a Gemini API request
 * @param {string} modelId - Model ID
 * @param {Object} requestBody - Request body
 * @returns {Promise<GeminiResponse>} - API response
 */
/**
 * Execute a request using the Google Generative AI SDK
 */
/**
 * Transform internal request format to SDK format
 * @param internalRequest - Request in internal format
 * @returns Request in SDK format
 */
function transformToSdkFormat(internalRequest) {
    // Map internalRequest (SdkRequest) directly to SDK payload
    const sdkRequest = {
        contents: internalRequest.contents,
        generationConfig: internalRequest.generationConfig
    };
    if (internalRequest.systemInstruction && internalRequest.systemInstruction.trim()) {
        sdkRequest.systemInstruction = internalRequest.systemInstruction;
    }
    return sdkRequest;
}
/**
 * Transform SDK response to internal response format
 * @param sdkResponse - Response from SDK
 * @returns Response in internal format
 */
function transformFromSdkResponse(sdkResponse) {
    try {
        // Use the SDK's helper method to safely get the text
        var text = sdkResponse.text();
        // Map to our internal GeminiResponse structure
        return {
            candidates: [{
                    content: {
                        parts: [{
                                text: text || "" // Ensure text is always a string
                            }]
                    }
                }]
        };
    }
    catch (e) {
        console.error("SDK Error extracting text from response:", e);
        // Return a minimal response indicating an error occurred
        return {
            candidates: [{
                    content: {
                        parts: [{
                                text: "[Error extracting response content from SDK]"
                            }]
                    }
                }]
        };
    }
}
function executeRequest(modelId, internalRequest) {
    return __awaiter(this, void 0, void 0, function () {
        var model, sdkRequest, result, sdkResponse, internalResponse, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.error('[executeRequest] Full SDK payload:', JSON.stringify(internalRequest, null, 2));
                    console.error(`[executeRequest] Executing request for model: ${modelId}`);
                    model = genAI.getGenerativeModel({ model: modelId });
                    sdkRequest = transformToSdkFormat(internalRequest);
                    console.error("SDK Request Body:", JSON.stringify(sdkRequest, null, 2).substring(0, 500) + '...'); // Log for debugging
                    return [4 /*yield*/, model.generateContent(sdkRequest)];
                case 1:
                    result = _a.sent();
                    sdkResponse = result.response;
                    console.error("SDK Response received."); // Log for debugging
                    internalResponse = transformFromSdkResponse(sdkResponse);
                    return [2 /*return*/, internalResponse];
                case 2:
                    error_1 = _a.sent();
                    console.error("API call failed for model ".concat(modelId, ":"), error_1);
                    // Handle rate limiting and other errors
                    if (error_1 instanceof Error && error_1.message.includes('rate')) {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, // Using InvalidParams instead of LimitExceeded
                        "Rate limit exceeded for ".concat(modelId, ". Please try again later."));
                    }
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Error: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Format Gemini API response
 * @param {GeminiResponse} responseData - API response data
 * @param {string} modelId - Model ID used
 * @param {Object} options - Formatting options
 * @returns {Object} - Formatted response
 */
function formatResponse(responseData, modelId, options) {
    var _a, _b, _c, _d;
    if (options === void 0) { options = {}; }
    try {
        // Extract text from response
        var candidate = (_a = responseData.candidates) === null || _a === void 0 ? void 0 : _a[0];
        if (!candidate) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'No response generated.'
                    }
                ],
                isError: true
            };
        }
        var parts = ((_b = candidate.content) === null || _b === void 0 ? void 0 : _b.parts) || [];
        var text = parts.filter(function (part) { return part.text; }).map(function (part) { return part.text || ''; }).join('\n');
        // Extract search results if available
        var searchResults = '';
        if ((_d = (_c = candidate.grounding_metadata) === null || _c === void 0 ? void 0 : _c.search_entry_point) === null || _d === void 0 ? void 0 : _d.rendered_content) {
            searchResults = candidate.grounding_metadata.search_entry_point.rendered_content;
        }
        // Combine text and search results
        if (searchResults) {
            text += '\n\n### Search Results:\n' + searchResults;
        }
        return {
            content: [
                {
                    type: 'text',
                    text: text
                }
            ],
            metadata: __assign({ modelUsed: modelId }, options)
        };
    }
    catch (error) {
        console.error('Error formatting response:', error);
        return {
            content: [
                {
                    type: 'text',
                    text: "Error formatting response: ".concat(error instanceof Error ? error.message : 'Unknown error')
                }
            ],
            isError: true
        };
    }
}
/**
 * Handle Gemini search request
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
function handleSearch(request) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, query, file_path, model_id, enable_thinking, modelId, internalRequest, response, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    // Validate required parameters
                    if (!request.params.arguments || typeof request.params.arguments.query !== 'string') {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Query parameter is required and must be a string');
                    }
                    _a = request.params.arguments, query = _a.query, file_path = _a.file_path, model_id = _a.model_id, enable_thinking = _a.enable_thinking;
                    modelId = (0, model_selector_js_1.selectModel)({
                        modelId: model_id,
                        taskType: model_selector_js_1.TaskType.GENERAL_SEARCH,
                        filePath: file_path,
                        thinking: !!enable_thinking,
                        searchRequired: true
                    });
                    return [4 /*yield*/, (0, request_builder_js_1.buildSearchRequest)({
                            query: query,
                            modelId: modelId,
                            filePath: file_path,
                            enableThinking: !!enable_thinking
                        })];
                case 1:
                    internalRequest = _b.sent();
                    return [4 /*yield*/, executeRequest(modelId, internalRequest)];
                case 2:
                    response = _b.sent();
                    // Format response
                    return [2 /*return*/, formatResponse(response, modelId, {
                            operation: exports.TOOL_NAMES.GEM_SEARCH,
                            withFile: !!file_path,
                            thinking: enable_thinking
                        })];
                case 3:
                    error_2 = _b.sent();
                    console.error('Error in search handler:', error_2);
                    if (error_2 instanceof types_js_1.McpError) {
                        throw error_2;
                    }
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Error: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error')
                                }
                            ],
                            isError: true
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle Gemini reasoning request
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
function handleReason(request) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, problem, file_path, model_id, _b, show_steps, modelId, internalRequest, response, error_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    // Validate required parameters
                    if (!request.params.arguments || typeof request.params.arguments.problem !== 'string') {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Problem parameter is required and must be a string');
                    }
                    _a = request.params.arguments, problem = _a.problem, file_path = _a.file_path, model_id = _a.model_id, _b = _a.show_steps, show_steps = _b === void 0 ? true : _b;
                    modelId = model_id || model_selector_js_1.MODELS.FLASH_THINKING;
                    return [4 /*yield*/, (0, request_builder_js_1.buildReasoningRequest)({
                            problem: problem,
                            modelId: modelId,
                            filePath: file_path,
                            showSteps: show_steps
                        })];
                case 1:
                    internalRequest = _c.sent();
                    return [4 /*yield*/, executeRequest(modelId, internalRequest)];
                case 2:
                    response = _c.sent();
                    // Format response
                    return [2 /*return*/, formatResponse(response, modelId, {
                            operation: exports.TOOL_NAMES.GEM_REASON,
                            withFile: !!file_path,
                            showSteps: show_steps
                        })];
                case 3:
                    error_3 = _c.sent();
                    console.error('Error in reasoning handler:', error_3);
                    if (error_3 instanceof types_js_1.McpError) {
                        throw error_3;
                    }
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Error: ".concat(error_3 instanceof Error ? error_3.message : 'Unknown error')
                                }
                            ],
                            isError: true
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle Gemini processing request
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
function handleProcess(request) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, content, file_path, _c, operation, model_id, modelId, internalRequest, response, error_4;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 3, , 4]);
                    // Validate required parameters
                    if (!request.params.arguments ||
                        (typeof request.params.arguments.content !== 'string' && !request.params.arguments.file_path)) {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Either content or file_path parameter is required');
                    }
                    _a = request.params.arguments, _b = _a.content, content = _b === void 0 ? '' : _b, file_path = _a.file_path, _c = _a.operation, operation = _c === void 0 ? 'analyze' : _c, model_id = _a.model_id;
                    modelId = model_id || model_selector_js_1.MODELS.FLASH_LITE;
                    return [4 /*yield*/, (0, request_builder_js_1.buildProcessingRequest)({
                            content: content,
                            filePath: file_path,
                            operation: operation,
                            modelId: modelId
                        })];
                case 1:
                    internalRequest = _d.sent();
                    return [4 /*yield*/, executeRequest(modelId, internalRequest)];
                case 2:
                    response = _d.sent();
                    // Format response
                    return [2 /*return*/, formatResponse(response, modelId, {
                            operation: exports.TOOL_NAMES.GEM_PROCESS,
                            processingType: operation,
                            withFile: !!file_path
                        })];
                case 3:
                    error_4 = _d.sent();
                    console.error('Error in processing handler:', error_4);
                    if (error_4 instanceof types_js_1.McpError) {
                        throw error_4;
                    }
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Error: ".concat(error_4 instanceof Error ? error_4.message : 'Unknown error')
                                }
                            ],
                            isError: true
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle Gemini file analysis request
 * @param {Object} request - MCP request
 * @returns {Promise<Object>} - MCP response
 */
function handleAnalyze(request) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, file_path, instruction, model_id, selectedModelId, internalRequest, response, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    // Validate required parameters
                    if (!request.params.arguments || !request.params.arguments.file_path) {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'file_path parameter is required');
                    }
                    _a = request.params.arguments, file_path = _a.file_path, instruction = _a.instruction, model_id = _a.model_id;
                    selectedModelId = model_id || (0, model_selector_js_1.selectModel)({
                        filePath: file_path,
                        taskType: model_selector_js_1.TaskType.FILE_ANALYSIS
                    });
                    return [4 /*yield*/, (0, request_builder_js_1.buildAnalysisRequest)({
                            filePath: file_path,
                            instruction: instruction,
                            modelId: selectedModelId
                        })];
                case 1:
                    internalRequest = _b.sent();
                    return [4 /*yield*/, executeRequest(selectedModelId, internalRequest)];
                case 2:
                    response = _b.sent();
                    // Format response
                    return [2 /*return*/, formatResponse(response, selectedModelId, {
                            operation: exports.TOOL_NAMES.GEM_ANALYZE,
                            fileType: Array.isArray(file_path)
                                ? 'multiple files'
                                : (0, file_handler_js_1.getFileTypeCategory)(file_path)
                        })];
                case 3:
                    error_5 = _b.sent();
                    console.error('Error in analysis handler:', error_5);
                    if (error_5 instanceof types_js_1.McpError) {
                        throw error_5;
                    }
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Error: ".concat(error_5 instanceof Error ? error_5.message : 'Unknown error')
                                }
                            ],
                            isError: true
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
