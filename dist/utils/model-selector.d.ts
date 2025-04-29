import { GeminiRequest } from '../interfaces/common.js';
export declare const MODELS: {
    FLASH: string;
    FLASH_LITE: string;
    FLASH_THINKING: string;
};
/**
 * Select the appropriate model ID based on tool name and arguments
 * @param toolName - Name of the tool being used
 * @param args - Tool arguments
 * @returns Selected model ID
 */
export declare function selectToolModel(toolName: string, args: any): string;
/**
 * Select the appropriate model ID based on request properties
 * @param internalRequest - Request object
 * @returns Selected model ID string
 */
export declare function selectModelId(internalRequest: GeminiRequest): string;
