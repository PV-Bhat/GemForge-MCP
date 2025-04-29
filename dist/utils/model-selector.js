import { MODEL_IDS, TOOL_NAMES } from '../config/constants.js';
// Legacy model IDs for backward compatibility
// These should match the verified available models in MODEL_IDS
export const MODELS = {
    FLASH: MODEL_IDS.BALANCED, // 'gemini-2.0-flash-001'
    FLASH_LITE: MODEL_IDS.FAST, // 'gemini-2.0-flash-lite-001'
    FLASH_THINKING: MODEL_IDS.ADVANCED // 'gemini-1.5-pro'
};
/**
 * Map of preview models to their fallback models when not available
 * Updated with models confirmed to be available with the latest SDK
 */
const MODEL_FALLBACKS = {
    // Priority for latest models (2.5+)
    'gemini-2.5-pro-latest': 'gemini-2.5-pro-exp-03-25',
    'gemini-2.5-flash-latest': 'gemini-2.5-flash-preview-04-17',
    'gemini-2.5-pro-preview-03-25': 'gemini-2.5-pro-exp-03-25',
    'gemini-2.5-flash-preview-04-17': 'gemini-2.5-flash-preview-04-17',
    'gemini-2.5-flash-preview-05-15': 'gemini-2.5-flash-preview-04-17',
    // Standard 2.5 models
    'gemini-2.5-pro': 'gemini-2.5-pro-exp-03-25',
    'gemini-2.5-flash': 'gemini-2.5-flash-preview-04-17',
    // 2.0 models with specific versions
    'gemini-2.0-pro': 'gemini-2.0-flash-001',
    'gemini-2.0-flash': 'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite-001',
    // 1.5 models
    'gemini-1.5-pro': 'gemini-1.5-pro-002',
    'gemini-1.5-pro-latest': 'gemini-1.5-pro-002',
    'gemini-1.5-flash': 'gemini-2.0-flash-001', // Fallback to 2.0 flash
    'gemini-1.5-flash-latest': 'gemini-2.0-flash-001', // Fallback to 2.0 flash
    // Experimental/Thinking/Reasoning models
    'gemini-2.0-flash-thinking-exp-01-21': 'gemini-1.5-pro-002',
    'gemini-2.0-flash-thinking': 'gemini-1.5-pro-002',
    'gemini-2.0-flash-thinking-latest': 'gemini-1.5-pro-002',
    'gemini-2.0-flash-reasoning': 'gemini-1.5-pro-002',
    'gemini-2.0-pro-reasoning': 'gemini-1.5-pro-002'
};
/**
 * Check if a model is available and return fallback if needed
 * @param modelId - Requested model ID
 * @returns Usable model ID (original or fallback)
 */
function getUsableModelId(modelId) {
    // First check direct matches in our fallback map
    if (MODEL_FALLBACKS[modelId]) {
        const fallback = MODEL_FALLBACKS[modelId];
        console.error(`Model ${modelId} is not directly available. Using fallback: ${fallback}`);
        return fallback;
    }
    // Check for preview/experimental models
    if (modelId.includes('preview') || modelId.includes('exp')) {
        // Try to find an appropriate fallback based on capability level
        if (modelId.includes('2.5-pro')) {
            console.error(`Unknown preview/experimental 2.5 pro model ${modelId}. Using fallback: gemini-2.5-pro-exp-03-25`);
            return 'gemini-2.5-pro-exp-03-25';
        }
        else if (modelId.includes('2.5-flash')) {
            console.error(`Unknown preview/experimental 2.5 flash model ${modelId}. Using fallback: gemini-2.5-flash-preview-04-17`);
            return 'gemini-2.5-flash-preview-04-17';
        }
        else if (modelId.includes('pro')) {
            console.error(`Unknown preview/experimental pro model ${modelId}. Using fallback: gemini-1.5-pro-002`);
            return 'gemini-1.5-pro-002';
        }
        else if (modelId.includes('flash-lite')) {
            console.error(`Unknown preview/experimental flash-lite model ${modelId}. Using fallback: gemini-2.0-flash-lite-001`);
            return 'gemini-2.0-flash-lite-001';
        }
        else {
            console.error(`Unknown preview/experimental flash model ${modelId}. Using fallback: gemini-2.0-flash-001`);
            return 'gemini-2.0-flash-001';
        }
    }
    // For unknown models, provide a safe fallback based on model type
    if (!modelId.includes('-001') && !modelId.includes('-002')) {
        if (modelId.includes('2.5-pro')) {
            return 'gemini-2.5-pro-exp-03-25';
        }
        else if (modelId.includes('2.5-flash')) {
            return 'gemini-2.5-flash-preview-04-17';
        }
        else if (modelId.includes('1.5-pro')) {
            return 'gemini-1.5-pro-002';
        }
        else if (modelId.includes('2.0-flash-lite')) {
            return 'gemini-2.0-flash-lite-001';
        }
        else if (modelId.includes('2.0-flash')) {
            return 'gemini-2.0-flash-001';
        }
    }
    // If we don't have a specific fallback, return as is
    return modelId;
}
/**
 * Select the appropriate model ID for the gemini_search tool
 * @param args - Search arguments
 * @returns Selected model ID
 */
function selectSearchModel(args) {
    // User-provided model_id has highest priority
    if (args.model_id) {
        console.error(`[selectSearchModel] Using user-provided model_id: ${args.model_id}`);
        return getUsableModelId(args.model_id);
    }
    // Always use gemini-2.0-flash-001 for search (per user requirement)
    console.error('[selectSearchModel] Using gemini-2.0-flash-001 for search (per user requirement)');
    return getUsableModelId('gemini-2.0-flash-001');
}
/**
 * Select the appropriate model ID for the gemini_reason tool
 * @param args - Reason arguments
 * @returns Selected model ID
 */
function selectReasonModel(args) {
    // User-provided model_id has highest priority
    if (args.model_id) {
        console.error(`[selectReasonModel] Using user-provided model_id: ${args.model_id}`);
        return getUsableModelId(args.model_id);
    }
    // Always use gemini-2.5-pro-exp-03-25 for reasoning (per user requirement)
    console.error('[selectReasonModel] Using gemini-2.5-pro-exp-03-25 for reasoning (per user requirement)');
    return getUsableModelId('gemini-2.5-pro-exp-03-25');
}
/**
 * Select the appropriate model ID for the gemini_code tool
 * @param args - Code arguments
 * @returns Selected model ID
 */
function selectCodeModel(args) {
    // User-provided model_id has highest priority
    if (args.model_id) {
        console.error(`[selectCodeModel] Using user-provided model_id: ${args.model_id}`);
        return getUsableModelId(args.model_id);
    }
    // Always use gemini-2.5-pro-exp-03-25 for code (per user requirement)
    console.error('[selectCodeModel] Using gemini-2.5-pro-exp-03-25 for code (per user requirement)');
    return getUsableModelId('gemini-2.5-pro-exp-03-25');
}
/**
 * Select the appropriate model ID for the gemini_fileops tool
 * @param args - Fileops arguments
 * @returns Selected model ID
 */
function selectFileopsModel(args) {
    // User-provided model_id has highest priority
    if (args.model_id) {
        console.error(`[selectFileopsModel] Using user-provided model_id: ${args.model_id}`);
        return getUsableModelId(args.model_id);
    }
    // Use gemini-1.5-pro-002 only for large files (use_large_context_model)
    if (args.use_large_context_model === true) {
        console.error('[selectFileopsModel] Large context model requested, using gemini-1.5-pro-002 (per user requirement)');
        return getUsableModelId('gemini-1.5-pro-002');
    }
    // Default: use gemini-2.0-flash-lite-001 for fileops
    console.error('[selectFileopsModel] Using gemini-2.0-flash-lite-001 for file operations (per user requirement)');
    return getUsableModelId('gemini-2.0-flash-lite-001');
}
/**
 * Select the appropriate model ID based on tool name and arguments
 * @param toolName - Name of the tool being used
 * @param args - Tool arguments
 * @returns Selected model ID
 */
export function selectToolModel(toolName, args) {
    console.error(`[selectToolModel] Selecting model for tool: ${toolName}`);
    switch (toolName) {
        case TOOL_NAMES.GEM_SEARCH:
            // Always use gemini-2.0-flash-001 for search
            return selectSearchModel(args);
        case TOOL_NAMES.GEM_REASON:
            // Always use gemini-2.5-pro-exp-03-25 for reasoning
            return selectReasonModel(args);
        case TOOL_NAMES.GEM_CODE:
            // Always use gemini-2.5-pro-exp-03-25 for code
            return selectCodeModel(args);
        case TOOL_NAMES.GEM_FILEOPS:
            // Use gemini-2.0-flash-lite-001 for fileops, 1.5-pro only for large context
            return selectFileopsModel(args);
        // Legacy tool names
        case TOOL_NAMES.SEARCH:
            return selectSearchModel(args);
        case TOOL_NAMES.REASON:
            return selectReasonModel(args);
        default:
            console.error(`[selectToolModel] Unknown tool: ${toolName}, using default balanced model`);
            return getUsableModelId('gemini-2.0-flash-001');
    }
}
/**
 * Select the appropriate model ID based on request properties
 * @param internalRequest - Request object
 * @returns Selected model ID string
 */
export function selectModelId(internalRequest) {
    // Direct model_id override has highest priority
    if (internalRequest.model_id && typeof internalRequest.model_id === 'string') {
        console.error(`[selectModelId] Using overridden model ID: ${internalRequest.model_id}`);
        return getUsableModelId(internalRequest.model_id);
    }
    // If toolName is provided, use tool-specific model selection
    if (internalRequest.toolName) {
        console.error(`[selectModelId] Using tool-specific model selection for: ${internalRequest.toolName}`);
        return selectToolModel(internalRequest.toolName, internalRequest);
    }
    // Use capability level mapping as fallback
    const level = internalRequest.capability_level || 'balanced'; // Default to balanced
    console.error(`[selectModelId] Selecting model based on capability level: ${level}`);
    // Map capability level to model ID
    let selectedModel;
    switch (level) {
        case 'fast':
            selectedModel = MODEL_IDS.FAST;
            break;
        case 'advanced':
            selectedModel = MODEL_IDS.ADVANCED;
            break;
        case 'large_context':
            selectedModel = MODEL_IDS.LARGE_CONTEXT;
            break;
        case 'balanced':
        default:
            selectedModel = MODEL_IDS.BALANCED;
            break;
    }
    // Check if the selected model needs fallback
    return getUsableModelId(selectedModel);
}
//# sourceMappingURL=model-selector.js.map