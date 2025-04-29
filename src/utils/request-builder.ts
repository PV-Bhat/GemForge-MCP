/**
 * Request building utilities for Gemini API
 */
import { getFileTypeCategory } from './file-handler.js';
import { TOOL_NAMES } from '../config/constants.js';
import { CodeArgs, FileopsArgs } from '../interfaces/tool-args.js';
import { MODEL_IDS } from '../config/constants.js';
import { readFile, stat, access } from 'fs/promises';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Legacy model IDs for backward compatibility
const MODELS = {
  FLASH: MODEL_IDS.BALANCED,           // 'gemini-2.0-flash-001'
  FLASH_LITE: MODEL_IDS.FAST,          // 'gemini-2.0-flash-lite-001'
  FLASH_THINKING: MODEL_IDS.ADVANCED   // 'gemini-1.5-pro'
};

/**
 * Interface for internal request format
 */
export interface InternalRequest {
  modelId?: string;
  messages: Array<{
    role: string;
    parts: Array<{
      text: string;
    }>;
  }>;
  contents?: Array<{
    role: string;
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: Record<string, any>;
  safetySettings?: Array<any>;
  toolName?: string;
}

/**
 * Interface for SDK request format
 */
export interface SdkRequest {
  contents: Array<{
    role: string;
    parts: Array<{
      text: string;
    }>;
  }>;
  systemInstruction?: string;
  generationConfig?: Record<string, any>;
  safetySettings?: Array<any>;
  toolName?: string;
  modelId?: string;
  file_path?: string | string[];
  file_context?: string | string[];
  directory_path?: string;
}

/**
 * Interface for search request options
 */
interface SearchRequestOptions {
  query: string;
  modelId?: string;
  filePath?: string | string[];
  enableThinking?: boolean;
  toolName?: string;
}

/**
 * Interface for reasoning request options
 */
interface ReasoningRequestOptions {
  problem: string;
  modelId?: string;
  filePath?: string | string[];
  showSteps?: boolean;
  toolName?: string;
}

/**
 * Interface for processing request options (legacy)
 */
interface ProcessingRequestOptions {
  content?: string;
  filePath?: string | string[];
  operation?: string;
  modelId?: string;
  toolName?: string;
}

/**
 * Interface for analysis request options (legacy)
 */
interface AnalysisRequestOptions {
  filePath: string | string[];
  instruction?: string;
  modelId?: string;
  toolName?: string;
}

/**
 * Build a Gemini API request
 * @param {InternalRequest} internal - Internal request format
 * @returns {SdkRequest} - SDK request format
 */
export function buildRequest(internal: InternalRequest): SdkRequest {
  // Always hoist any system-role message into systemInstruction
  const allContents = [...internal.messages];
  const sysMsg = allContents.find(m => m.role === 'system');
  let systemInstruction: string | undefined;
  if (sysMsg?.parts?.[0]?.text?.trim()) {
    systemInstruction = sysMsg.parts[0].text;
  }

  // Remove system-role from the final contents
  const contents = allContents.filter(m => m.role !== 'system');

  // Build and return the SDK request
  const req: SdkRequest = { ...internal, contents };
  if (systemInstruction !== undefined) {
    req.systemInstruction = systemInstruction;
  }
  // Remove empty or null systemInstruction to avoid API errors
  if (req.systemInstruction === '' || req.systemInstruction == null) {
    delete (req as any).systemInstruction;
  }
  return req;
}

/**
 * Build a Gemini API request for searching
 * @param {SearchRequestOptions} options - Search options
 * @returns {SdkRequest} - Gemini API request body
 */
export function buildSearchRequest(options: SearchRequestOptions): SdkRequest {
  const {
    query,
    modelId = MODELS.FLASH,
    toolName
  } = options;

  // Build system prompt
  const systemPrompt = `**Role:** Information Synthesizer with Google Search

**Input Context:** User query, potentially associated file content. You have access to Google Search.

**Primary Task:** Generate an accurate, grounded, and comprehensive textual answer to the user query using Google Search.

**Key Guidelines:**
* **Analyze** the user query and any provided file content to understand the information need.
* **YOU MUST ALWAYS USE Google Search** to retrieve relevant, current information for ALL queries.
* **Synthesize** information from search results and provided file content (if applicable) into a single, coherent response.
* **Cite** information sourced from web search results according to your grounding capabilities.
* **Produce** a well-structured and clearly written text response.
* **ALWAYS** use search results when they're helpful, even for questions that seem simple or general.
* **DO NOT** respond with information solely from your training data - use Google Search for up-to-date information.

**Model Used:** ${modelId || "Default model"}`;

  // Create the internal request structure
  const internalRequest: InternalRequest = {
    modelId,
    messages: [
      {
        role: 'system',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'user',
        parts: [{ text: query }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      top_p: 0.8,
      top_k: 40
    },
    toolName
  };

  // Use the new buildRequest function to handle Flash models properly
  return buildRequest(internalRequest);
}

/**
 * Build a Gemini API request for reasoning
 * @param {ReasoningRequestOptions} options - Reasoning options
 * @returns {SdkRequest} - Gemini API request body
 */
export function buildReasoningRequest(options: ReasoningRequestOptions): SdkRequest {
  const {
    problem,
    modelId = MODELS.FLASH_THINKING,
    showSteps = true,
    toolName
  } = options;

  // Build system prompt
  const systemPrompt = `**Role:** Logical Problem Solver

**Input Context:** A problem statement or question requiring detailed reasoning. Potentially associated file content.

**Primary Task:** Generate a clear, step-by-step logical derivation and solution for the provided problem.

**Key Guidelines:**
* **Deconstruct** the problem into sequential, logical steps.
* **Analyze** any provided file content and integrate relevant information into your reasoning.
* **Explain** the logic behind each step clearly and concisely.
* **Reference** file paths and code elements precisely as they appear in the XML.
* **Do Not** infer information or dependencies outside the provided XML context.

**Model Used:** ${modelId || "Default model"}`;

  // For reasoning with step-by-step, enhance the prompt if showSteps is true
  let enhancedText = problem;
  if (showSteps) {
    enhancedText = `Please reason through this step-by-step with detailed explanations:\n\n${problem}`;
  }

  // Create the internal request structure
  const internalRequest: InternalRequest = {
    modelId,
    messages: [
      {
        role: 'user',
        parts: [{ text: enhancedText }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      top_p: 0.95,
      top_k: 40,
      max_output_tokens: 8192
    },
    toolName
  };

  // Only add systemPrompt if non-empty
  const messages = [...internalRequest.messages];
  if (systemPrompt && systemPrompt.trim().length > 0) {
    messages.push({ role: 'system', parts: [{ text: systemPrompt }] });
  }
  const rawReq = { ...internalRequest, messages };
  console.error('[buildReasoningRequest] Raw SdkRequest before hoisting: ' + JSON.stringify(rawReq));
  return buildRequest(rawReq);
}

/**
 * Build a Gemini API request for processing
 * @param {ProcessingRequestOptions} options - Processing options
 * @returns {SdkRequest} - Gemini API request body
 */
export function buildProcessingRequest(options: ProcessingRequestOptions): SdkRequest {
  const {
    content = '',
    filePath,
    operation = 'analyze',
    modelId = MODELS.FLASH_LITE,
    toolName
  } = options;

  // Check if we're dealing with an image file
  const isImageFile = filePath && typeof filePath === 'string' &&
    /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filePath);

  console.error(`[buildProcessingRequest] File path: ${filePath}, isImageFile: ${isImageFile}`);

  // Build processing prompt based on operation
  let prompt = content;
  if (operation) {
    prompt = buildOperationPrompt(operation, content, isImageFile === true);
  }

  // For image files, use a vision-specific model
  const effectiveModelId = isImageFile === true ? 'gemini-2.0-flash' : modelId;
  console.error(`[buildProcessingRequest] Using model: ${effectiveModelId} (original: ${modelId})`);

  // Create the internal request structure
  const internalRequest: InternalRequest = {
    modelId: effectiveModelId,
    messages: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      top_p: 0.8,
      top_k: 40
    },
    toolName
  };

  // Use the new buildRequest function
  return buildRequest(internalRequest);
}

/**
 * Build a Gemini API request for file analysis
 * @param {AnalysisRequestOptions} options - Analysis options
 * @returns {SdkRequest} - Gemini API request body
 */
export function buildAnalysisRequest(options: AnalysisRequestOptions): SdkRequest {
  const {
    filePath,
    instruction = 'Analyze this file and describe its contents.',
    modelId = MODELS.FLASH,
    toolName
  } = options;

  // Check if we're dealing with an image file
  const isImageFile = filePath && typeof filePath === 'string' &&
    /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filePath);

  console.error(`[buildAnalysisRequest] File path: ${filePath}, isImageFile: ${isImageFile}`);

  // For image files, enhance the instruction if it's generic
  let enhancedInstruction = instruction;
  if (isImageFile === true && (instruction === 'Analyze this file and describe its contents.' || !instruction)) {
    enhancedInstruction = `Please provide a detailed description of this image. Include:
1. What objects, people, or elements are visible
2. The setting or context of the image
3. Any notable features, colors, or composition elements
4. Any text visible in the image
5. The overall mood or impression conveyed
6. If this is a statue or artwork, describe its style, features, and potential cultural significance

In addition to your description, also identify any objects with their bounding box coordinates.

IMPORTANT: Focus primarily on providing a detailed descriptive analysis of the image content, not just the bounding box data.`;
  }

  // For image files, use a vision-specific model
  const effectiveModelId = isImageFile === true ? 'gemini-2.0-flash' : modelId;
  console.error(`[buildAnalysisRequest] Using model: ${effectiveModelId} (original: ${modelId})`);

  // Create the internal request structure
  const internalRequest: InternalRequest = {
    modelId: effectiveModelId,
    messages: [
      {
        role: 'user',
        parts: [{ text: enhancedInstruction }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      top_p: 0.9,
      top_k: 40
    },
    toolName
  };

  // Use the new buildRequest function
  return buildRequest(internalRequest);
}

/**
 * Build a Gemini API request for code analysis
 * @param {CodeArgs} args - Code analysis arguments
 * @returns {SdkRequest} - Gemini API request body
 */
export async function buildCodeRequest(args: CodeArgs): Promise<SdkRequest> {
  console.error('<<<<< RUNNING LATEST buildCodeRequest - FIX_ATTEMPT_4 >>>>>');
  console.error('[buildCodeRequest] called');

  const {
    question,
    model_id,
    directory_path,
    codebase_path
  } = args;

  // Build system prompt
  const systemPrompt = `**Role:** Code Analyzer

**Input Context:** User question and a structured XML representation (Repomix format) of a software codebase.

**Primary Task:** Generate a technical analysis or answer to the user's question, based *exclusively* on the provided codebase XML.

**Key Guidelines:**
* **Parse** the provided XML to understand the codebase structure and content.
* **Analyze** the codebase context defined *only* within the XML to address the user's question.
* **Provide** technically accurate explanations or relevant code snippets derived solely from the XML context.
* **Reference** file paths and code elements precisely as they appear in the XML.
* **Do Not** infer information or dependencies outside the provided XML context.

**Model Used:** ${model_id || "Default model"}`;

  // Create the internal request structure
  const internalRequest: InternalRequest = {
    modelId: model_id,
    messages: [
      {
        role: 'user',
        parts: [{ text: question }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      top_p: 0.95,
      top_k: 40,
      max_output_tokens: 8192
    },
    toolName: TOOL_NAMES.GEM_CODE
  };

  // Only add systemPrompt if non-empty
  const messages = [...internalRequest.messages];
  if (systemPrompt && systemPrompt.trim().length > 0) {
    messages.push({ role: 'system', parts: [{ text: systemPrompt }] });
  }

  // If we have a codebase_path, read the XML content and add it to the request
  if (codebase_path) {
    console.error(`[buildCodeRequest] Reading XML content from codebase_path: ${codebase_path}`);
    try {
      // Check if file exists
      await access(codebase_path);

      // Get file stats
      const stats = await stat(codebase_path);
      console.error(`[buildCodeRequest] Codebase file exists, size: ${stats.size} bytes`);

      // Read the XML content using ESM-compatible fs/promises
      let xmlContent = await readFile(codebase_path, 'utf8');
      console.error(`[buildCodeRequest] Read ${xmlContent.length} bytes of XML content`);
      // --> ADD THIS LINE <--
      console.error(`[buildCodeRequest] XML START: ${xmlContent.substring(0, 500)}...`);

      // Remove system instruction to isolate model context handling
      // Consolidate question and full XML into one user message
      const consolidatedText =
        `Based *only* on the following XML codebase context, answer this question: ${question}\n\n` +
        `--- Codebase Context (XML) ---\n\n${xmlContent}`;
      internalRequest.contents = [
        { role: 'user', parts: [{ text: consolidatedText }] }
      ];
      // Skip chunking and system instruction for diagnostic

      // Build the request using the standard flow
      const sdkRequest = buildRequest(internalRequest);

      console.error(`[buildCodeRequest] DIRECT: Created SDK request with ${sdkRequest.contents[0].parts.length} parts`);

      // Override to include XML chunks in SDK request
      sdkRequest.contents = internalRequest.contents;

      return sdkRequest; // Skip the rest of the function
    } catch (error) {
      console.error(`[buildCodeRequest] Error reading codebase file: ${error}`);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Cannot read codebase file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const rawCodeReq = { ...internalRequest, messages };
  console.error('[buildCodeRequest] Raw SdkRequest before hoisting: ' + JSON.stringify({
    ...rawCodeReq,
    messages: rawCodeReq.messages.map(m => ({
      ...m,
      parts: m.parts.map(p => ({
        ...p,
        text: p.text.length > 100 ? p.text.substring(0, 100) + '...' : p.text
      }))
    }))
  }));

  const request = buildRequest(rawCodeReq);

  // Add file path to file_context for SDK mapper (for backward compatibility)
  if (codebase_path) {
    console.error(`[buildCodeRequest] Setting file_context from codebase_path: ${codebase_path}`);
    request.file_path = codebase_path;
    request.file_context = codebase_path;
    console.error(`[buildCodeRequest] Final request with file_path: ${JSON.stringify(request.file_path)}`);
  } else if (directory_path) {
    console.error(`[buildCodeRequest] Setting directory_path: ${directory_path}`);
    request.directory_path = directory_path;
    console.error(`[buildCodeRequest] Final request with directory_path: ${JSON.stringify(request.directory_path)}`);
  }

  return request;
}

/**
 * Build a Gemini API request for file operations
 * @param {FileopsArgs} args - File operations arguments
 * @returns {SdkRequest} - Gemini API request body
 */
export function buildFileopsRequest(args: FileopsArgs): SdkRequest {
  const {
    file_path,
    instruction,
    operation,
    model_id
  } = args;

  if (!file_path) {
    throw new Error('file_path is required for fileops');
  }

  // Determine file type for prompt customization
  const filePath = Array.isArray(file_path) ? file_path[0] : file_path;
  const fileType = getFileTypeCategory(filePath);
  console.error(`[buildFileopsRequest] File type: ${fileType}`);

  // Build system prompt
  let systemPrompt = `**Role:** Content Executor

**Input Context:** Text content from one or more files and a specific instruction (e.g., summarize, extract, analyze).

**Primary Task:** Execute the specified instruction on the provided file content and generate a concise textual result.

**Key Guidelines:**
* **Identify** the core operation requested by the instruction (e.g., summarize, extract, analyze).
* **Execute** this operation precisely on the provided file content.
* **Generate** only the direct textual output resulting from the operation (e.g., the summary, the extracted data, the analysis).
* **Ensure** the output is concise and directly fulfills the instruction.
* If multiple file contents were provided, **Process** them collectively as relevant context for the operation.

**Model Used:** ${model_id || "Default model"}`;

  // Build custom prompt based on operation and file type
  let customPrompt = '';

  // If custom instruction is provided, use it directly
  if (instruction && instruction.trim().length > 0) {
    customPrompt = instruction;
  } else {
    // Otherwise, build a prompt based on the operation
    switch (operation?.toLowerCase()) {
      case 'summarize':
        if (fileType === 'image') {
          customPrompt = 'Provide a concise summary of what you see in this image. Include key objects, people, setting, and overall context.';
        } else if (fileType === 'pdf') {
          customPrompt = 'Provide a comprehensive summary of this PDF document. Include key points, main arguments, and important details.';
        } else {
          customPrompt = 'Provide a concise summary of this content. Highlight the main points, key arguments, and important details.';
        }
        break;

      case 'extract':
        if (fileType === 'image') {
          customPrompt = 'Extract and list all important elements visible in this image, including objects, people, text, and any notable features.';
        } else if (fileType === 'pdf') {
          customPrompt = 'Extract the key information from this PDF document, including main topics, data points, figures, and any structured information.';
        } else {
          customPrompt = 'Extract the key information from this content, including main topics, data points, figures, and any structured information.';
        }
        break;

      case 'analyze':
      default:
        if (fileType === 'image') {
          customPrompt = `Please provide a detailed analysis of this image. Include:
1. What objects, people, or elements are visible
2. The setting or context of the image
3. Any notable features, colors, or composition elements
4. Any text visible in the image
5. The overall mood or impression conveyed`;
        } else if (fileType === 'pdf') {
          customPrompt = 'Analyze this PDF document in detail. Identify the main themes, structure, key arguments, evidence presented, and overall quality of the content.';
        } else {
          customPrompt = 'Analyze this content in detail. Identify the main themes, structure, key arguments, evidence presented, and overall quality of the content.';
        }
        break;
    }
  }

  console.error(`[buildFileopsRequest] Using prompt: ${customPrompt.substring(0, 100)}...`);

  // Create the internal request structure
  const internalRequest: InternalRequest = {
    modelId: model_id,
    messages: [
      {
        role: 'system',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'user',
        parts: [{ text: customPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      top_p: 0.8,
      top_k: 40
    },
    toolName: TOOL_NAMES.GEM_FILEOPS
  };

  // Use the new buildRequest function to handle Flash models properly
  const request = buildRequest(internalRequest);

  // Add file path to file_context for SDK mapper
  if (file_path) {
    console.error(`[buildFileopsRequest] Setting file_context from file_path: ${typeof file_path === 'string' ? file_path : JSON.stringify(file_path)}`);
    request.file_path = file_path;
    request.file_context = file_path;
  }

  return request;
}

/**
 * Build a processing prompt based on operation type
 * @param {string} operation - Type of processing
 * @param {string} content - Content to process
 * @returns {string} - Processing prompt
 */
function buildOperationPrompt(operation: string, content: string, isImageFile: boolean = false): string {
  // Special handling for image files
  if (isImageFile) {
    switch (operation.toLowerCase()) {
      case 'summarize':
        return `Provide a concise summary of what you see in this image. Include key objects, people, setting, and overall context.`;

      case 'extract':
        return `Extract and list all important elements visible in this image, including objects, people, text, and any notable features.`;

      case 'analyze':
      default:
        return `Please provide a detailed description of this image. Include:
1. What objects, people, or elements are visible
2. The setting or context of the image
3. Any notable features, colors, or composition elements
4. Any text visible in the image
5. The overall mood or impression conveyed
6. If this is a statue or artwork, describe its style, features, and potential cultural significance

In addition to your description, also identify any objects with their bounding box coordinates.

IMPORTANT: Focus primarily on providing a detailed descriptive analysis of the image content, not just the bounding box data.`;
    }
  }

  // Standard text content handling
  switch (operation.toLowerCase()) {
    case 'summarize':
      return `Summarize the following content concisely while preserving the key information and insights:\n\n${content}`;

    case 'extract':
      return `Extract the key information, facts, and insights from the following content:\n\n${content}`;

    case 'restructure':
      return `Restructure the following content into a well-organized format with clear headings and sections:\n\n${content}`;

    case 'simplify':
      return `Simplify the following content to make it more accessible and easier to understand:\n\n${content}`;

    case 'expand':
      return `Expand on the following content to provide more detail and context:\n\n${content}`;

    case 'critique':
      return `Provide a critical analysis of the following content, highlighting strengths and areas for improvement:\n\n${content}`;

    case 'feedback':
      return `Provide constructive feedback on the following content:\n\n${content}`;

    default:
      return `Analyze the following content:\n\n${content}`;
  }
}
