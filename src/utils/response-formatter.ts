import { MODELS } from '../config/models.js';
import { RESPONSE_FORMAT } from '../config/constants.js';

/**
 * Response options for formatting
 */
export interface ResponseOptions {
  /** Whether to include thinking mode output */
  includeThinking?: boolean;

  /** Whether to format search results */
  includeSearch?: boolean;

  /** Custom formatting options */
  customFormat?: Record<string, any>;

  /** Operation type (e.g., GEM_SEARCH, GEM_REASON, etc.) */
  operation?: string;

  /** Processing type for GEM_PROCESS operation */
  processingType?: string;

  /** Whether the request included a file */
  withFile?: boolean;

  /** Whether thinking mode is enabled */
  thinking?: boolean;

  /** Whether to show steps (for reasoning) */
  showSteps?: boolean;

  /** Capability level used */
  capabilityLevel?: string;

  /** Whether the file is an image */
  isImageFile?: boolean;

  /** File type category */
  fileType?: string;
}

/**
 * Formats responses from the Gemini API in a consistent way
 * @param response The API response data
 * @param modelId The model ID that was used
 * @param options Formatting options
 * @param sdkResponse Optional raw SDK response object
 * @returns Formatted response for MCP
 */
export function formatResponse(response: any, modelId: string, options: ResponseOptions = {}, sdkResponse?: any): any {
  // Get model information
  const model = MODELS[modelId] || { displayName: 'Gemini API', id: modelId };

  console.error('formatResponse called with:', {
    hasResponse: !!response,
    modelId,
    options,
    hasSdkResponse: !!sdkResponse,
    sdkResponseHasTextMethod: sdkResponse && typeof sdkResponse.text === 'function'
  });

  // CRITICAL: First try to extract text from the raw SDK response if available
  let mainText = '';
  if (sdkResponse && typeof sdkResponse.text === 'function') {
    try {
      mainText = sdkResponse.text() || '';
      console.error('Successfully extracted text from raw SDK response:', mainText.substring(0, 100) + '...');
    } catch (e) {
      console.error('Error calling sdkResponse.text():', e);
    }
  } else {
    console.error('SDK response does not have text() method or is not provided');
  }

  // If we couldn't get text from the raw SDK response, fall back to extracting from the transformed response
  if (!mainText || mainText.trim().length === 0) {
    console.error('Falling back to extractMainContent from transformed response');
    mainText = extractMainContent(response);
  }

  // For image files, ensure we have a good description
  if (options.isImageFile && (!mainText || mainText.includes('bounding box') || mainText.length < 50)) {
    console.error('Image file detected but no good description found, adding generic description');
    // If we only have bounding box data, add a more helpful message
    if (mainText.includes('bounding box')) {
      const boundingBoxText = mainText;
      mainText = `The image contains objects that have been detected with bounding boxes. For a more detailed description, try using the \`gemini_analyze\` tool with a specific instruction.\n\n${boundingBoxText}`;
    }
  }

  // Add thinking content if requested
  let fullText = mainText;
  if (options.includeThinking) {
    try {
      const thinkingText = extractThinkingContent(response);
      if (thinkingText && thinkingText.trim().length > 0) {
        fullText = `${fullText}\n\n**Thinking:**\n${thinkingText}`;
      }
    } catch (e) {
      console.error('Error adding thinking content:', e);
    }
  }

  // Add search results if requested
  if (options.includeSearch) {
    try {
      const searchText = extractSearchResults(response);
      if (searchText && searchText.trim().length > 0) {
        fullText = `${fullText}\n\n**Search Results:**\n${searchText}`;
      }
    } catch (e) {
      console.error('Error adding search results:', e);
    }
  }

  // Prioritize descriptive text over bounding box data
  if (fullText && typeof fullText === 'string' && fullText.trim().length > 0) {
    // Add model information to the response text at the start
    const modelInfo = `**Model used: ${response.modelUsed || model.id}**\n\n`;

    return {
      content: [
        {
          type: 'text',
          text: modelInfo + fullText
        }
      ],
      metadata: {
        modelUsed: response.modelUsed || model.displayName,
        modelId: response.modelUsed || model.id,
        ...options.customFormat
      }
    };
  }

  // Check for vision model response with both text and bounding boxes
  console.error('Checking for vision model response with bounding boxes...');
  console.error('Full response structure:', JSON.stringify(response, null, 2));

  const boundingBoxes = response?.candidates?.[0]?.content?.boundingBoxes;
  if (boundingBoxes && Array.isArray(boundingBoxes)) {
    console.error('Found bounding boxes in response:', JSON.stringify(boundingBoxes, null, 2));

    // For vision models, we want to combine the descriptive text with the bounding box data
    // If we already have descriptive text, use it; otherwise try to extract it from other parts
    let combinedText = '';

    // If we have meaningful text already, use it
    if (fullText && fullText.trim().length > 10 && !fullText.includes('No content found')) {
      combinedText = `${fullText}\n\n**Detected Objects:**\n\`\`\`json\n${JSON.stringify(boundingBoxes, null, 2)}\n\`\`\``;
    } else {
      // Try to find any descriptive text in the response
      let descriptionText = '';

      // Check for text in various locations in the response structure
      if (response?.candidates?.[0]?.content?.parts) {
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
          if (part.text && typeof part.text === 'string' && part.text.trim().length > 10) {
            descriptionText = part.text;
            console.error('Found description text in parts:', descriptionText);
            break;
          }
        }
      }

      // If we found description text, combine it with bounding boxes
      if (descriptionText) {
        combinedText = `${descriptionText}\n\n**Detected Objects:**\n\`\`\`json\n${JSON.stringify(boundingBoxes, null, 2)}\n\`\`\``;
      } else {
        // If no description text was found, just show the bounding boxes with a better message
        combinedText = `The image analysis detected the following objects:\n\`\`\`json\n${JSON.stringify(boundingBoxes, null, 2)}\n\`\`\`\n\nFor a more detailed description, try using the \`gemini_analyze\` tool with a specific instruction.`;
      }
    }

    // Add model information to the response text at the start
    const modelInfo = `**Model used: ${response.modelUsed || model.id}**\n\n`;

    return {
      content: [
        {
          type: 'text',
          text: modelInfo + combinedText
        }
      ],
      metadata: {
        modelUsed: response.modelUsed || model.displayName,
        modelId: response.modelUsed || model.id,
        hasVisionResults: true,
        ...options.customFormat
      }
    };
  }

  // Default fallback if no content is available
  // Add model information to the response text at the start
  const modelInfo = `**Model used: ${response.modelUsed || model.id}**\n\n`;

  return {
    content: [
      {
        type: 'text',
        text: modelInfo + 'No meaningful content could be extracted from the response.'
      }
    ],
    metadata: {
      modelUsed: response.modelUsed || model.displayName,
      modelId: response.modelUsed || model.id,
      ...options.customFormat
    }
  };
}

/**
 * Extracts main content from the API response
 * @param response The API response data
 * @returns Extracted main content
 */
function extractMainContent(response: any): string {
  try {
    console.error('Response structure:', JSON.stringify(response, null, 2).substring(0, 500) + '...');

    // Direct text extraction if available at the top level
    if (response?.text && typeof response.text === 'string' && response.text.trim().length > 0) {
      console.error('Found text at top level of response');
      return response.text;
    }

    // Check if we have a valid response structure
    if (response?.candidates?.length > 0) {
      const candidate = response.candidates[0];

      // Try to get text directly from candidate if available
      if (candidate.text && typeof candidate.text === 'string' && candidate.text.trim().length > 0) {
        console.error('Found text directly in candidate');
        return candidate.text;
      }

      // Special handling for vision model responses
      if (candidate.content?.boundingBoxes && Array.isArray(candidate.content.boundingBoxes)) {
        console.error('Found vision model response with bounding boxes:', JSON.stringify(candidate.content.boundingBoxes, null, 2));

        // Look for descriptive text that might accompany the bounding boxes
        if (candidate.content?.parts && Array.isArray(candidate.content.parts)) {
          console.error('Examining content parts for descriptive text:', JSON.stringify(candidate.content.parts, null, 2));

          // First, try to find any substantial text parts (longer than 100 chars)
          const longTextParts = candidate.content.parts
            .filter((part: any) => {
              if (!part || typeof part.text !== 'string') return false;
              return part.text.trim().length > 100;
            })
            .map((part: any) => part.text);

          if (longTextParts.length > 0) {
            console.error('Found long text parts in vision response');
            return longTextParts.join('\n\n');
          }

          // If no long text parts, look for any descriptive text
          const descriptiveParts = candidate.content.parts
            .filter((part: any) => {
              if (!part || typeof part.text !== 'string') {
                console.error('Skipping non-text part:', JSON.stringify(part, null, 2));
                return false;
              }
              const text = part.text.trim();
              console.error(`Examining text part: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
              // Skip empty, very short, or JSON-like strings
              const isDescriptive = text.length > 20 && !text.startsWith('{') && !text.startsWith('[');
              console.error(`Is descriptive: ${isDescriptive}`);
              return isDescriptive;
            })
            .map((part: any) => part.text);

          console.error(`Found ${descriptiveParts.length} descriptive parts`);

          if (descriptiveParts.length > 0) {
            console.error('Found descriptive text parts in vision response');
            return descriptiveParts.join('\n\n');
          }

          // If still no descriptive text, try to get any text content
          const allTextParts = candidate.content.parts
            .filter((part: any) => part && typeof part.text === 'string' && part.text.trim().length > 0)
            .map((part: any) => part.text);

          if (allTextParts.length > 0) {
            console.error('Found some text parts in vision response');
            return allTextParts.join('\n\n');
          }
        }

        // If no descriptive text was found with the bounding boxes,
        // we'll let the main formatter handle it by returning empty string
        // so it can combine the bounding boxes with a generic message
        return '';
      }

      // Standard text response handling
      // Extract content from parts
      if (candidate.content?.parts && Array.isArray(candidate.content.parts)) {
        const textParts = candidate.content.parts
          .filter((part: any) => part && typeof part.text === 'string')
          .map((part: any) => part.text);

        if (textParts.length > 0) {
          console.error('Found text parts in response');
          return textParts.join('\n');
        }
      }

      // Fallback for other formats
      if (candidate.content?.text && typeof candidate.content.text === 'string') {
        console.error('Found text in candidate.content.text');
        return candidate.content.text;
      }

      // Try to extract from finishReason or other fields
      if (candidate.finishReason === 'STOP' && candidate.content) {
        console.error('Candidate finished with STOP, trying to extract any available content');
        return JSON.stringify(candidate.content, null, 2);
      }
    }

    // If we can't extract content in expected format, check for other response structures
    if (response?.text && typeof response.text === 'function') {
      try {
        const text = response.text();
        if (text) {
          console.error('Extracted text using response.text() method');
          return text;
        }
      } catch (e) {
        console.error('Error calling response.text():', e);
      }
    }

    // Last resort: try to find any text property in the response
    if (typeof response === 'object' && response !== null) {
      const textProps = findTextProperties(response);
      if (textProps.length > 0) {
        console.error('Found text properties in response:', textProps);
        return textProps.join('\n\n');
      }
    }

    console.error('No content found in response structure');
    return 'No content found in response';
  } catch (error) {
    console.error('Error extracting main content:', error);
    return 'Error extracting content from response';
  }
}

/**
 * Recursively finds all text properties in an object
 * @param obj The object to search
 * @param maxDepth Maximum recursion depth
 * @returns Array of text values found
 */
function findTextProperties(obj: any, maxDepth: number = 3, currentDepth: number = 0): string[] {
  if (currentDepth > maxDepth || typeof obj !== 'object' || obj === null) {
    return [];
  }

  let results: string[] = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // If it's a text property with meaningful content
      if (key === 'text' && typeof value === 'string' && value.trim().length > 10) {
        results.push(value);
      }
      // Recursively search nested objects
      else if (typeof value === 'object' && value !== null) {
        results = results.concat(findTextProperties(value, maxDepth, currentDepth + 1));
      }
    }
  }

  return results;
}

/**
 * Extracts thinking content from the API response
 * @param response The API response data
 * @returns Extracted thinking content
 */
function extractThinkingContent(response: any): string {
  try {
    // Check if we have a valid candidate with thinking
    if (response?.candidates?.length > 0) {
      const candidate = response.candidates[0];

      // Extract thinking directly
      if (candidate.thinking) {
        return candidate.thinking;
      }
    }

    return '';
  } catch (error) {
    console.error('Error extracting thinking content:', error);
    return '';
  }
}

/**
 * Extracts search results from the API response
 * @param response The API response data
 * @returns Extracted search results
 */
function extractSearchResults(response: any): string {
  try {
    // Check if we have a valid candidate with search results
    if (response?.candidates?.length > 0) {
      const candidate = response.candidates[0];

      // Extract search results from grounding metadata
      if (candidate.grounding_metadata?.search_entry_point?.rendered_content) {
        return candidate.grounding_metadata.search_entry_point.rendered_content;
      }

      // Alternative format for search results
      if (candidate.grounding_metadata?.search_results) {
        return formatSearchResultsSummary(candidate.grounding_metadata.search_results);
      }
    }

    return '';
  } catch (error) {
    console.error('Error extracting search results:', error);
    return '';
  }
}

/**
 * Formats search results into a readable summary
 * @param searchResults Raw search results
 * @returns Formatted search results summary
 */
function formatSearchResultsSummary(searchResults: any[]): string {
  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return '';
  }

  return searchResults.map((result, index) => {
    const title = result.title || 'Untitled';
    const url = result.url || '';
    const snippet = result.snippet || '';

    return `${index + 1}. **${title}**\n   ${url}\n   ${snippet}\n`;
  }).join('\n');
}
