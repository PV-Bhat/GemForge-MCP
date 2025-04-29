/**
 * Execute a request using the Google Generative AI SDK
 * @param modelId - Model ID to use
 * @param sdkPayload - Pre-built SDK payload
 * @param isRetry - Whether this is a retry attempt
 * @returns Response from the API
 */
export declare function executeRequest(modelId: string, sdkPayload: any, isRetry?: boolean): Promise<{
    response: import("../interfaces/common.js").GeminiResponse;
    rawSdkResponse: import("@google/generative-ai").EnhancedGenerateContentResponse;
}>;
