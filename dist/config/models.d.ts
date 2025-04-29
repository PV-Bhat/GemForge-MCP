/**
 * Configuration for supported Gemini models
 */
import { TaskType } from '../interfaces/common.js';
/**
 * Available Gemini models with their capabilities
 */
export declare const MODELS: Record<string, any>;
/**
 * Get the recommended model ID for a specific task type
 */
export declare function getModelForTask(taskType: TaskType): string;
/**
 * Get the recommended model ID based on file type
 */
export declare function getModelForFileType(fileType: string): string;
/**
 * Default model to use when no specific model is specified
 */
export declare const DEFAULT_MODEL_ID = "gemini-2.0-flash";
export { TaskType };
