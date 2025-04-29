/**
 * Constants used throughout the application
 */
import dotenv from 'dotenv';
dotenv.config();
/**
 * API configuration
 */
export const API = {
    /** Gemini API base endpoint */
    ENDPOINT: 'https://generativelanguage.googleapis.com/v1/models',
    /** Gemini API key from environment variables */
    API_KEY: process.env.GEMINI_API_KEY || '',
    /** Whether using paid tier (for rate limits) */
    IS_PAID_TIER: process.env.GEMINI_PAID_TIER === 'true',
    /** Default model ID from environment or fallback - trying 2.5 models first */
    DEFAULT_MODEL_ID: process.env.DEFAULT_MODEL_ID || 'gemini-2.5-flash-preview-04-17',
};
/**
 * Centralized Model IDs - updated with verified available models
 */
export const MODEL_IDS = {
    /** Fast, efficient model for simple tasks and rapid processing */
    FAST: 'gemini-2.0-flash-lite-001',
    /** Balanced model for general-purpose use */
    BALANCED: 'gemini-2.0-flash-001',
    /** Advanced model for complex reasoning and high-quality outputs */
    ADVANCED: 'gemini-2.5-pro-exp-03-25',
    /** Model optimized for handling very large context windows */
    LARGE_CONTEXT: 'gemini-1.5-pro-002',
    /** Legacy model IDs for backward compatibility */
    LEGACY: {
        FLASH: 'gemini-2.0-flash-001',
        FLASH_LITE: 'gemini-2.0-flash-lite-001',
        FLASH_THINKING: 'gemini-2.5-pro-exp-03-25'
    }
};
/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
    /** Maximum number of retries for rate limited requests */
    MAX_RETRIES: 5,
    /** Base delay for exponential backoff (milliseconds) */
    BASE_DELAY_MS: 1000,
    /** Maximum delay for exponential backoff (milliseconds) */
    MAX_DELAY_MS: 60000,
    /** Jitter factor for randomizing backoff delays (0-1) */
    JITTER_FACTOR: 0.2
};
/**
 * Error message templates
 */
export const ERROR_MESSAGES = {
    /** API key missing error */
    API_KEY_MISSING: 'GEMINI_API_KEY environment variable is required',
    /** Rate limit error template */
    RATE_LIMIT: (modelId, timeInSeconds) => `Rate limit reached for ${modelId}. Try again in ${timeInSeconds} seconds.`,
    /** Thinking capability error */
    THINKING_NOT_SUPPORTED: (modelDisplayName) => `Thinking mode is not supported by ${modelDisplayName}. Please use Gemini 2.5 Pro.`,
    /** Search capability error */
    SEARCH_NOT_SUPPORTED: (modelDisplayName) => `Search integration is not supported by ${modelDisplayName}. Please use Gemini 2.5 Flash or Gemini 2.0 Flash.`,
    /** Model not found error */
    MODEL_NOT_FOUND: (modelId) => `Model ${modelId} not found. Please check available models and their supported methods.`,
};
/**
 * Response formatting
 */
export const RESPONSE_FORMAT = {
    /** Section headings for different response components */
    SECTIONS: {
        THINKING: '### Thinking Process:',
        RESPONSE: '### Final Response:',
        SEARCH: '### Search Results:'
    }
};
/**
 * Function names for tool handlers
 */
export const TOOL_NAMES = {
    // New specialized toolset
    GEM_SEARCH: 'gemini_search', // For search-enabled queries (Gemini 2.0 Flash)
    GEM_REASON: 'gemini_reason', // For complex reasoning (Gemini 2.5 Flash/Pro)
    GEM_CODE: 'gemini_code', // For coding tasks (Gemini 2.5 Pro)
    GEM_FILEOPS: 'gemini_fileops', // For file operations (Gemini 2.0 Flash-Lite/1.5 Pro)
    // Legacy names for backward compatibility - only keeping what's needed
    SEARCH: 'gemini_search',
    REASON: 'gemini_reason',
    ANALYZE_FILE: 'gemini_analyze',
    RAPID_SEARCH: 'gemini_search'
};
//# sourceMappingURL=constants.js.map