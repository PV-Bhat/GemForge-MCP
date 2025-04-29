/**
 * Common interfaces and types for Gemini MCP
 */
import { SafetySetting } from '@google/generative-ai';

/**
 * Mapping of task types to recommended models
 */
export enum TaskType {
  GENERAL_SEARCH = 'general_search',
  RAPID_SEARCH = 'rapid_search',
  RAPID_PROCESSING = 'rapid_processing',
  COMPLEX_REASONING = 'complex_reasoning',
  FILE_ANALYSIS = 'file_analysis',
  LARGE_CONTEXT_PROCESSING = 'large_context_processing'
}

/**
 * Gemini model configuration interface
 */
export interface GeminiModel {
  /** Model ID used in API requests */
  id: string;

  /** Human-readable model name */
  displayName: string;

  /** Maximum context window size in tokens */
  contextWindow: number;

  /** Maximum output tokens */
  maxOutputTokens: number;

  /** Maximum requests per minute (free tier) */
  freeRpm: number;

  /** Model capabilities */
  capabilities: {
    /** Whether the model supports Google Search integration */
    search: boolean;

    /** Whether the model supports thinking mode */
    thinking: boolean;

    /** Whether the model supports multimodal inputs */
    multimodal: boolean;

    /** Whether the model is optimized for fast responses */
    fastResponse: boolean;
  };

  /** Primary use cases for this model */
  useCases: string[];
}

/**
 * Gemini Request interface
 */
export interface GeminiRequest {
  /** Text prompt or prompt object */
  prompt?: string | { text: string };

  /** Structured content array */
  contents?: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;

  /** Generation configuration parameters */
  generation_config?: GenerationConfig;

  /** Direct access to temperature */
  temperature?: number;

  /** Direct access to max output tokens */
  maxOutputTokens?: number;

  /** Direct access to top P */
  topP?: number;

  /** Direct access to top K */
  topK?: number;

  /** Safety settings configuration */
  safetySettings?: SafetySetting[];

  /** File context (local paths or URLs) */
  file_context?: string | string[];

  /** File path (for compatibility with some tools) */
  file_path?: string | string[];

  /** Tool identifier to enable specific features */
  toolName?: string;

  /** Capability level for model selection */
  capability_level?: 'fast' | 'balanced' | 'advanced' | 'large_context';

  /** Direct model ID override (highest priority) */
  model_id?: string;
}

/**
 * API response interface
 */
export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    grounding_metadata?: {
      search_entry_point?: {
        rendered_content?: string;
      };
    };
  }>;

  /** Additional grounding metadata from search results */
  groundingMetadata?: any;

  /** Model ID that was used to generate this response */
  modelUsed?: string;
}

/**
 * Base arguments for tool requests
 */
export interface BaseArgs {
  /** Optional model ID override */
  model_id?: string;
}

/**
 * File input options
 */
export interface FileInput {
  /** Path to a file */
  file_path?: string | string[];
}

/**
 * Generation configuration
 */
export interface GenerationConfig {
  /** Temperature for generation */
  temperature?: number;

  /** Top-p sampling */
  top_p?: number;

  /** Top-k sampling */
  top_k?: number;

  /** Maximum output tokens */
  max_output_tokens?: number;
}
