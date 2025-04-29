/**
 * Manages rate limiting for Gemini API requests
 * Tracks request timestamps, implements exponential backoff,
 * and retries failed requests when appropriate
 */
export declare class RateLimitManager {
    /** Map to track request timestamps by model ID */
    private requestTimestamps;
    /** Whether the user is on paid tier */
    private isPaidTier;
    /**
     * Creates a new RateLimitManager
     * @param isPaidTier Whether the user is on paid tier
     */
    constructor(isPaidTier?: boolean);
    /**
     * Checks if a request can be made for the specified model
     * @param modelId The model ID to check
     * @returns true if a request can be made, false otherwise
     */
    canMakeRequest(modelId: string): boolean;
    /**
     * Records a request for the specified model
     * @param modelId The model ID to record a request for
     */
    recordRequest(modelId: string): void;
    /**
     * Calculates time until next request slot is available
     * @param modelId The model ID to check
     * @returns Time in milliseconds until next available request slot
     */
    getTimeUntilNextSlot(modelId: string): number;
    /**
     * Executes an API call with automatic retry for rate limiting
     * @param modelId The model ID being used
     * @param apiCall Function that makes the API call
     * @returns Promise that resolves to the API response
     */
    executeWithRetry<T>(modelId: string, apiCall: () => Promise<T>): Promise<T>;
    /**
     * Checks if an error is a rate limit error
     * @param error The error to check
     * @returns true if it's a rate limit error, false otherwise
     */
    private isRateLimitError;
    /**
     * Calculates backoff time with exponential backoff + jitter
     * @param retry Current retry count
     * @returns Backoff time in milliseconds
     */
    private calculateBackoff;
    /**
     * Sleep for a specified duration
     * @param ms Time to sleep in milliseconds
     * @returns Promise that resolves after the sleep duration
     */
    private sleep;
}
/**
 * Create and export a singleton instance of the rate limit manager
 */
export declare const rateLimitManager: RateLimitManager;
