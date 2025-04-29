/**
 * SDK Mapper utilities for Gemini API
 *
 * This file provides utility functions for mapping between our internal request/response
 * formats and the Google Generative AI SDK formats.
 */
import { GenerateContentRequest } from '@google/generative-ai';
import { GeminiRequest, GeminiResponse } from '../interfaces/common.js';
/**
 * Transform internal request format to SDK format
 * @param internalRequest - Request in internal format
 * @returns Promise resolving to SDK request format
 */
export declare function transformToSdkFormat(internalRequest: GeminiRequest, modelId?: string): Promise<GenerateContentRequest>;
/**
 * Transform SDK response to internal response format
 * @param sdkResponse - Response from SDK
 * @returns Response in internal format
 */
export declare function transformFromSdkResponse(sdkResponse: any): GeminiResponse;
