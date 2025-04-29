/**
 * Configuration for supported Gemini models
 */
import { GeminiModel, TaskType } from '../interfaces/common.js';

/**
 * Available Gemini models with their capabilities
 */
export const MODELS: Record<string, any> = {
  'gemini-2.5-pro-preview-03-25': {
    id: 'gemini-2.5-pro-preview-03-25',
    displayName: 'Gemini 2.5 Pro',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    freeRpm: 15,
    capabilities: {
      search: true,
      thinking: true,
      multimodal: true,
      fastResponse: false
    },
    useCases: [
      'Advanced analysis and coding',
      'Complex reasoning tasks',
      'Information retrieval with search',
      'Advanced multimodal processing'
    ]
  },
  'gemini-2.5-flash-preview-04-17': {
    id: 'gemini-2.5-flash-preview-04-17',
    displayName: 'Gemini 2.5 Flash',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    freeRpm: 15,
    capabilities: {
      search: true,
      thinking: false,
      multimodal: true,
      fastResponse: true
    },
    useCases: [
      'General knowledge questions',
      'Information retrieval with search',
      'Processing multimodal inputs',
      'Balanced performance and speed'
    ]
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    freeRpm: 15,
    capabilities: {
      search: true,
      thinking: false,
      multimodal: true,
      fastResponse: false
    },
    useCases: [
      'General knowledge questions',
      'Information retrieval with search',
      'Processing multimodal inputs',
      'Reliable all-around performance'
    ]
  },
  'gemini-2.0-flash-lite': {
    id: 'gemini-2.0-flash-lite',
    displayName: 'Gemini 2.0 Flash-Lite',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    freeRpm: 15,
    capabilities: {
      search: false,
      thinking: false,
      multimodal: true,
      fastResponse: true
    },
    useCases: [
      'High-volume text processing',
      'Rapid file analysis',
      'Cost-efficient processing',
      'Large scale and speed operations'
    ]
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    freeRpm: 15,
    capabilities: {
      search: true,
      thinking: true,
      multimodal: true,
      fastResponse: false
    },
    useCases: [
      'Very large context windows',
      'Long document processing',
      'Multi-file analysis',
      'Extended conversation history'
    ]
  }
};

/**
 * Get the recommended model ID for a specific task type
 */
export function getModelForTask(taskType: TaskType): string {
  switch (taskType) {
    case TaskType.GENERAL_SEARCH:
      return 'gemini-2.5-flash-preview-04-17';
    case TaskType.RAPID_PROCESSING:
      return 'gemini-2.0-flash-lite';
    case TaskType.COMPLEX_REASONING:
      return 'gemini-2.5-pro-preview-03-25';
    case TaskType.FILE_ANALYSIS:
      return 'gemini-2.5-flash-preview-04-17';
    case TaskType.LARGE_CONTEXT_PROCESSING:
      return 'gemini-1.5-pro';
    default:
      return 'gemini-2.0-flash';
  }
}

/**
 * Get the recommended model ID based on file type
 */
export function getModelForFileType(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case 'image':
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'gemini-2.5-flash-preview-04-17'; // Flash for image analysis
    
    case 'pdf':
    case 'doc':
    case 'docx':
      return 'gemini-2.5-flash-preview-04-17'; // Flash for document analysis
    
    case 'txt':
    case 'md':
    case 'csv':
    case 'json':
      return 'gemini-2.0-flash-lite'; // Flash-Lite for text files
    
    case 'code':
    case 'js':
    case 'ts':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'cs':
      return 'gemini-2.5-pro-preview-03-25'; // Pro for code
    
    default:
      return 'gemini-2.0-flash'; // Default to Flash
  }
}

/**
 * Default model to use when no specific model is specified
 */
export const DEFAULT_MODEL_ID = 'gemini-2.0-flash';

// Re-export TaskType for convenience
export { TaskType };
