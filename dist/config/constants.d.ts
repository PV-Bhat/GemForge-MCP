/**
 * Constants used throughout the application
 */
/**
 * API configuration
 */
export declare const API: {
    /** Gemini API base endpoint */
    ENDPOINT: string;
    /** Gemini API key from environment variables */
    API_KEY: string;
    /** Whether using paid tier (for rate limits) */
    IS_PAID_TIER: boolean;
    /** Default model ID from environment or fallback - trying 2.5 models first */
    DEFAULT_MODEL_ID: string;
};
/**
 * Centralized Model IDs - updated with verified available models
 */
export declare const MODEL_IDS: {
    /** Fast, efficient model for simple tasks and rapid processing */
    FAST: string;
    /** Balanced model for general-purpose use */
    BALANCED: string;
    /** Advanced model for complex reasoning and high-quality outputs */
    ADVANCED: string;
    /** Model optimized for handling very large context windows */
    LARGE_CONTEXT: string;
    /** Legacy model IDs for backward compatibility */
    LEGACY: {
        FLASH: string;
        FLASH_LITE: string;
        FLASH_THINKING: string;
    };
};
/**
 * Rate limiting configuration
 */
export declare const RATE_LIMITS: {
    /** Maximum number of retries for rate limited requests */
    MAX_RETRIES: number;
    /** Base delay for exponential backoff (milliseconds) */
    BASE_DELAY_MS: number;
    /** Maximum delay for exponential backoff (milliseconds) */
    MAX_DELAY_MS: number;
    /** Jitter factor for randomizing backoff delays (0-1) */
    JITTER_FACTOR: number;
};
/**
 * Error message templates
 */
export declare const ERROR_MESSAGES: {
    /** API key missing error */
    API_KEY_MISSING: string;
    /** Rate limit error template */
    RATE_LIMIT: (modelId: string, timeInSeconds: number) => string;
    /** Thinking capability error */
    THINKING_NOT_SUPPORTED: (modelDisplayName: string) => string;
    /** Search capability error */
    SEARCH_NOT_SUPPORTED: (modelDisplayName: string) => string;
    /** Model not found error */
    MODEL_NOT_FOUND: (modelId: string) => string;
};
/**
 * Response formatting
 */
export declare const RESPONSE_FORMAT: {
    /** Section headings for different response components */
    SECTIONS: {
        THINKING: string;
        RESPONSE: string;
        SEARCH: string;
    };
};
/**
 * Function names for tool handlers
 */
export declare const TOOL_NAMES: {
    GEM_SEARCH: string;
    GEM_REASON: string;
    GEM_CODE: string;
    GEM_FILEOPS: string;
    SEARCH: string;
    REASON: string;
    ANALYZE_FILE: string;
    RAPID_SEARCH: string;
};
