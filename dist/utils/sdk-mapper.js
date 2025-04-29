import { getMimeType, readFileAsBase64, isUrl, fileExists } from './file-handler.js';
import fs from 'fs/promises';
// Helper: which models are Flash models and support native search grounding via 'google_search'?
function isFlashModel(modelId) {
    return typeof modelId === 'string' && modelId.toLowerCase().includes('flash');
}
/**
 * Transform internal request format to SDK format
 * @param internalRequest - Request in internal format
 * @returns Promise resolving to SDK request format
 */
export async function transformToSdkFormat(internalRequest, modelId) {
    // Prepare parts array for multimodal content
    const parts = [];
    // Extract text prompt
    let promptText = "";
    try {
        // Try to extract text from various possible formats
        if (typeof internalRequest.prompt === 'string') {
            promptText = internalRequest.prompt;
        }
        else if (internalRequest.prompt && typeof internalRequest.prompt.text === 'string') {
            promptText = internalRequest.prompt.text;
        }
        else if (internalRequest.contents && Array.isArray(internalRequest.contents)) {
            // Try to extract from contents array
            const firstContent = internalRequest.contents[0];
            if (firstContent && firstContent.parts && Array.isArray(firstContent.parts)) {
                const firstPart = firstContent.parts[0];
                if (firstPart && typeof firstPart.text === 'string') {
                    promptText = firstPart.text;
                }
            }
        }
        // Also look for file_path in the request and normalize it to file_context if found
        // This helps handle cases where tools use file_path but the SDK expects file_context
        if (internalRequest.file_path && !internalRequest.file_context) {
            console.error(`[transformToSdkFormat] Found file_path but no file_context. Adding file_path to file_context: ${internalRequest.file_path}`);
            internalRequest.file_context = internalRequest.file_path;
        }
    }
    catch (error) {
        console.error("Error extracting prompt from request:", error);
    }
    // Remove the old prompt enhancement workaround - we'll use native search grounding instead
    // Add all text parts from the contents array
    if (Array.isArray(internalRequest.contents)) {
        for (const content of internalRequest.contents) {
            if (Array.isArray(content.parts)) {
                for (const part of content.parts) {
                    if (part.text) {
                        console.error(`[transformToSdkFormat] Adding text part from contents: ${part.text.substring(0, 100)}...`);
                        parts.push({ text: part.text });
                    }
                }
            }
        }
    }
    else if (promptText && promptText.trim()) {
        // Fallback to the old method if contents array is not available
        parts.push({ text: promptText });
    }
    // Process file context if present
    if (internalRequest.file_context) {
        const fileContexts = Array.isArray(internalRequest.file_context)
            ? internalRequest.file_context
            : [internalRequest.file_context];
        console.error(`[transformToSdkFormat] Processing ${fileContexts.length} file contexts:`, fileContexts);
        // Process each file/URL
        for (const fileContext of fileContexts) {
            try {
                if (isUrl(fileContext)) {
                    // URL handling (HTTP/HTTPS or GCS)
                    console.error(`[transformToSdkFormat] Processing URL: ${fileContext}`);
                    const mimeType = getMimeType(fileContext) || 'application/octet-stream';
                    console.error(`[transformToSdkFormat] URL MIME type: ${mimeType}`);
                    // Add URL reference as a secondary part
                    parts.push({
                        text: `[URL reference: ${fileContext}]

Please access and process this URL.`
                    });
                }
                else {
                    // Local file handling
                    const exists = await fileExists(fileContext);
                    console.error(`[transformToSdkFormat] Local file exists check: ${fileContext} - ${exists}`);
                    if (!exists) {
                        throw new Error(`File not found: ${fileContext}`);
                    }
                    let mimeType = getMimeType(fileContext);
                    console.error(`[transformToSdkFormat] Local file MIME type: ${mimeType}`);
                    if (!mimeType) {
                        console.warn(`[transformToSdkFormat] Could not determine MIME type for file: ${fileContext}. Using application/octet-stream.`);
                        mimeType = 'application/octet-stream';
                    }
                    // Special handling for XML, JSON, YAML files - convert to text/plain for better compatibility
                    if (mimeType === 'application/xml' || fileContext.toLowerCase().endsWith('.xml') ||
                        mimeType === 'application/json' || fileContext.toLowerCase().endsWith('.json') ||
                        mimeType === 'application/x-yaml' || fileContext.toLowerCase().endsWith('.yaml') || fileContext.toLowerCase().endsWith('.yml')) {
                        console.error(`[transformToSdkFormat] XML/JSON/YAML file detected, treating as text/plain for better compatibility`);
                        mimeType = 'text/plain';
                        // For these files, read as text and add as text part instead of binary
                        try {
                            const fileContent = await fs.readFile(fileContext, 'utf8');
                            console.error(`[transformToSdkFormat] Successfully read file as text, length: ${fileContent.length}`);
                            // For Repomix XML files, add them as inlineData
                            if ((fileContext.includes('repomix') || fileContent.includes('<repomix>') || fileContent.includes('<directory_structure>')) &&
                                (fileContext.toLowerCase().endsWith('.xml'))) {
                                console.error(`[transformToSdkFormat] Repomix XML file detected, adding as inlineData part`);
                                // Add as inlineData part
                                parts.push({
                                    inlineData: {
                                        mimeType: 'text/plain',
                                        data: Buffer.from(fileContent).toString('base64')
                                    }
                                });
                                continue; // Skip the binary processing below
                            }
                            // For JSON files, add with JSON formatting
                            if (fileContext.toLowerCase().endsWith('.json')) {
                                console.error(`[transformToSdkFormat] JSON file detected, adding as text part with JSON formatting`);
                                try {
                                    // Parse the JSON to ensure it's valid
                                    const jsonObj = JSON.parse(fileContent);
                                    // Stringify it with pretty formatting
                                    const prettyJson = JSON.stringify(jsonObj, null, 2);
                                    parts.push({
                                        text: `\`\`\`json\n${prettyJson}\n\`\`\``
                                    });
                                }
                                catch (jsonError) {
                                    console.error(`[transformToSdkFormat] Error parsing JSON: ${jsonError}`);
                                    // If parsing fails, just add as plain text
                                    parts.push({
                                        text: `File content (JSON):\n\n${fileContent}`
                                    });
                                }
                                continue; // Skip the binary processing below
                            }
                            // For YAML files, add with YAML formatting
                            if (fileContext.toLowerCase().endsWith('.yaml') || fileContext.toLowerCase().endsWith('.yml')) {
                                console.error(`[transformToSdkFormat] YAML file detected, adding as text part with YAML formatting`);
                                parts.push({
                                    text: `\`\`\`yaml\n${fileContent}\n\`\`\``
                                });
                                continue; // Skip the binary processing below
                            }
                            // For other XML files, add as text part
                            if (fileContext.toLowerCase().endsWith('.xml')) {
                                parts.push({
                                    text: fileContent
                                });
                                continue; // Skip the binary processing below
                            }
                            // For any other text files that matched the condition
                            parts.push({
                                text: fileContent
                            });
                            continue; // Skip the binary processing below
                        }
                        catch (error) {
                            console.error(`[transformToSdkFormat] Error reading file as text: ${fileContext}`, error);
                            // Fall back to binary processing
                        }
                    }
                    console.error(`[transformToSdkFormat] Processing local file with base64 encoding: ${fileContext}`);
                    try {
                        // Check if file exists again right before reading
                        const exists = await fileExists(fileContext);
                        if (!exists) {
                            console.error(`[transformToSdkFormat] File does not exist right before reading: ${fileContext}`);
                            throw new Error(`File not found: ${fileContext}`);
                        }
                        const base64Data = await readFileAsBase64(fileContext);
                        console.error(`[transformToSdkFormat] Successfully encoded file as base64, length: ${base64Data.length}, first 20 chars: ${base64Data.substring(0, 20)}...`);
                        // Add file as a secondary part
                        parts.push({
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        });
                        console.error(`[transformToSdkFormat] Successfully added inlineData part with mimeType: ${mimeType}`);
                    }
                    catch (error) {
                        console.error(`[transformToSdkFormat] Error reading file ${fileContext}:`, error);
                        throw error;
                    }
                }
            }
            catch (error) {
                console.error(`[transformToSdkFormat] Error processing file context "${fileContext}":`, error);
                // Add an error indicator part
                parts.push({ text: `[Error processing file: ${fileContext}]` });
            }
        }
    }
    // Ensure parts are not empty
    if (parts.length === 0) {
        console.warn("No valid text prompt or file context provided. Adding empty text part.");
        parts.push({ text: " " });
    }
    // Prioritize descriptive analysis by ensuring text parts are processed first
    parts.sort((a, _b) => ('text' in a ? -1 : 1));
    // Log parts count and preview
    console.error(`[transformToSdkFormat] parts=${parts.length}, ` +
        `first=${parts[0]?.text?.slice(0, 50).replace(/\s+/g, ' ')}…, ` +
        `last=${parts[parts.length - 1]?.text?.slice(-50).replace(/\s+/g, ' ')}…`);
    // Check if this is a Flash model
    const isFlash = modelId && isFlashModel(modelId);
    // Extract system message if present in the request contents
    let systemInstruction = "";
    let userContents = [];
    // Check if contents array exists in the request
    if (internalRequest.contents && Array.isArray(internalRequest.contents)) {
        // Find system message
        const systemMsg = internalRequest.contents.find(content => content && typeof content === 'object' && 'role' in content && content.role === 'system');
        // Extract system instruction text if found
        if (systemMsg && systemMsg.parts && Array.isArray(systemMsg.parts) && systemMsg.parts.length > 0) {
            const firstPart = systemMsg.parts[0];
            if (firstPart && typeof firstPart === 'object' && 'text' in firstPart) {
                systemInstruction = firstPart.text;
                console.error(`[transformToSdkFormat] Extracted system instruction: ${systemInstruction.substring(0, 50)}...`);
            }
        }
        // Filter out system messages for Flash models
        if (isFlash) {
            userContents = internalRequest.contents.filter(content => !(content && typeof content === 'object' && 'role' in content && content.role === 'system'));
            console.error(`[transformToSdkFormat] Filtered out system messages for Flash model`);
        }
        else {
            userContents = internalRequest.contents;
        }
    }
    // Create the base SDK request
    const sdkRequest = {
        contents: userContents.length > 0 ? userContents : [{ role: "user", parts }]
    };
    // Add systemInstruction for Flash models if we have one
    if (isFlash && systemInstruction) {
        console.error(`[transformToSdkFormat] Adding systemInstruction for Flash model`);
        sdkRequest.systemInstruction = systemInstruction;
    }
    // Also check if systemInstruction is directly present in the request
    if (internalRequest.systemInstruction) {
        console.error(`[transformToSdkFormat] Found systemInstruction in request, adding to SDK request`);
        sdkRequest.systemInstruction = internalRequest.systemInstruction;
    }
    // Log the request for debugging
    console.error('[transformToSdkFormat] SDK Request: ' + JSON.stringify(sdkRequest).substring(0, 500) + '...');
    // Build generation config from both direct parameters and nested config
    try {
        const generationConfig = {};
        // First check direct parameters (higher priority)
        if (typeof internalRequest.temperature === 'number') {
            generationConfig.temperature = internalRequest.temperature;
        }
        if (typeof internalRequest.maxOutputTokens === 'number') {
            generationConfig.maxOutputTokens = internalRequest.maxOutputTokens;
        }
        if (typeof internalRequest.topP === 'number') {
            generationConfig.topP = internalRequest.topP;
        }
        if (typeof internalRequest.topK === 'number') {
            generationConfig.topK = internalRequest.topK;
        }
        // Then check nested generation_config (lower priority, don't override direct parameters)
        if (internalRequest.generation_config) {
            // Map from snake_case in our internal format to camelCase in SDK
            if (typeof internalRequest.generation_config.temperature === 'number' &&
                typeof generationConfig.temperature !== 'number') {
                generationConfig.temperature = internalRequest.generation_config.temperature;
            }
            if (typeof internalRequest.generation_config.top_p === 'number' &&
                typeof generationConfig.topP !== 'number') {
                generationConfig.topP = internalRequest.generation_config.top_p;
            }
            if (typeof internalRequest.generation_config.top_k === 'number' &&
                typeof generationConfig.topK !== 'number') {
                generationConfig.topK = internalRequest.generation_config.top_k;
            }
            if (typeof internalRequest.generation_config.max_output_tokens === 'number' &&
                typeof generationConfig.maxOutputTokens !== 'number') {
                generationConfig.maxOutputTokens = internalRequest.generation_config.max_output_tokens;
            }
        }
        // Only add generation config if we have at least one property
        if (Object.keys(generationConfig).length > 0) {
            sdkRequest.generationConfig = generationConfig;
        }
        // Add safety settings if present
        if (internalRequest.safetySettings && Array.isArray(internalRequest.safetySettings)) {
            sdkRequest.safetySettings = internalRequest.safetySettings;
        }
        // Add native search grounding tool if the tool is gemini_search and model is a Flash model
        if (internalRequest.toolName === 'gemini_search' &&
            modelId && isFlashModel(modelId)) {
            console.error(`Activating native search grounding for Flash model (${modelId}) via googleSearch.`);
            // Use the googleSearch property for the tools parameter
            sdkRequest.tools = [{
                    googleSearch: {}
                }];
            // Log the tools configuration for debugging
            console.error(`[transformToSdkFormat] Using tools configuration: ${JSON.stringify(sdkRequest.tools)}`);
        }
    }
    catch (error) {
        console.error("Error building generation config or safety settings:", error);
    }
    return sdkRequest;
}
/**
 * Transform SDK response to internal response format
 * @param sdkResponse - Response from SDK
 * @returns Response in internal format
 */
export function transformFromSdkResponse(sdkResponse) {
    try {
        console.error('transformFromSdkResponse: Starting to process SDK response');
        console.error('SDK Response info: ' + JSON.stringify({
            type: typeof sdkResponse,
            hasTextMethod: typeof sdkResponse?.text === 'function',
            hasCandidates: !!sdkResponse?.candidates
        }));
        // Try to log the raw response structure
        try {
            console.error('Raw SDK response structure: ' + JSON.stringify(sdkResponse, (_, value) => {
                // Skip functions in the JSON output
                if (typeof value === 'function')
                    return '[Function]';
                // Truncate long strings
                if (typeof value === 'string' && value.length > 500)
                    return value.substring(0, 500) + '...';
                return value;
            }));
        }
        catch (e) {
            console.error('Could not stringify full SDK response:', e);
        }
        // Try to extract text using the text() method
        let responseText = "";
        let groundingMetadata = undefined;
        let boundingBoxes = undefined;
        // Extract text
        if (sdkResponse && typeof sdkResponse.text === 'function') {
            try {
                responseText = sdkResponse.text() || "";
                console.error('Successfully extracted text: ' + JSON.stringify({
                    preview: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
                }));
                // Check if the response contains invalid JSON characters
                if (responseText.includes('Selecting') && responseText.includes('"...')) {
                    console.warn('Detected potentially malformed JSON in response');
                    // Clean up the response by escaping problematic characters
                    responseText = responseText.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                }
                // Special handling for image responses that only contain bounding box data
                if (responseText.includes('bounding box') && responseText.length < 200) {
                    console.error('Detected image response with only bounding box data');
                    // Check if we have bounding boxes
                    const hasBoundingBoxes = sdkResponse?.candidates?.[0]?.content?.boundingBoxes &&
                        Array.isArray(sdkResponse.candidates[0].content.boundingBoxes) &&
                        sdkResponse.candidates[0].content.boundingBoxes.length > 0;
                    if (hasBoundingBoxes) {
                        // Add a more descriptive message for image analysis
                        responseText = `The image contains the following objects:\n\n${responseText}\n\nFor a more detailed description, try using the \`gemini_analyze\` tool with a specific instruction.`;
                    }
                }
            }
            catch (textError) {
                console.error('Error extracting text from response:', textError);
                responseText = `[Error extracting text: ${textError instanceof Error ? textError.message : 'Unknown error'}]`;
            }
        }
        else {
            console.error('SDK response does not have a text() method');
        }
        // Check for vision model response with bounding boxes
        try {
            if (sdkResponse?.candidates?.[0]?.content?.boundingBoxes) {
                boundingBoxes = sdkResponse.candidates[0].content.boundingBoxes;
                console.error('Found bounding boxes in SDK response: ' + JSON.stringify(boundingBoxes));
            }
        }
        catch (e) {
            console.error('Error checking for bounding boxes:', e);
        }
        // Fallback for unexpected response format
        if (!responseText) {
            responseText = "[Unable to extract text from response]";
        }
        // Extract grounding metadata if available
        try {
            if (sdkResponse.promptFeedback?.blockReason) {
                // Handle cases where the response was blocked
                console.warn("Response possibly blocked:", sdkResponse.promptFeedback.blockReason);
            }
            else if (sdkResponse.candidates && sdkResponse.candidates.length > 0) {
                const candidate = sdkResponse.candidates[0];
                if (candidate.groundingMetadata) {
                    groundingMetadata = candidate.groundingMetadata;
                    console.error("Extracted grounding metadata from response.");
                }
                else if (candidate.content?.parts?.[0]?.groundingMetadata) {
                    // Alternative location based on SDK structure
                    groundingMetadata = candidate.content.parts[0].groundingMetadata;
                    console.error("Extracted grounding metadata from content parts.");
                }
            }
        }
        catch (error) {
            console.error("Error extracting grounding metadata:", error);
            // Don't propagate the error, just log it
            groundingMetadata = null;
        }
        // Construct the response
        const internalResponse = {
            candidates: [{
                    content: {
                        parts: [{
                                text: responseText
                            }]
                    }
                }]
        };
        // Add bounding boxes if available
        if (boundingBoxes && boundingBoxes.length > 0) {
            console.error('Adding bounding boxes to internal response');
            if (internalResponse.candidates && internalResponse.candidates.length > 0 && internalResponse.candidates[0].content) {
                // Use type assertion to add boundingBoxes property
                internalResponse.candidates[0].content.boundingBoxes = boundingBoxes;
            }
        }
        // Add grounding metadata if available
        if (groundingMetadata) {
            try {
                internalResponse.groundingMetadata = groundingMetadata;
                // If there's search data in the grounding metadata, add it to the candidates structure too
                if (groundingMetadata.searchResults || groundingMetadata.webSearchResults) {
                    if (internalResponse.candidates && internalResponse.candidates.length > 0) {
                        // Safely stringify the metadata
                        let renderedContent;
                        try {
                            renderedContent = JSON.stringify(groundingMetadata);
                        }
                        catch (e) {
                            console.warn("Could not stringify grounding metadata:", e);
                            renderedContent = "[Complex metadata structure - could not stringify]";
                        }
                        internalResponse.candidates[0].grounding_metadata = {
                            search_entry_point: {
                                rendered_content: renderedContent
                            }
                        };
                    }
                }
            }
            catch (error) {
                console.error("Error adding grounding metadata to response:", error);
                // Continue without the metadata rather than failing completely
            }
        }
        return internalResponse;
    }
    catch (error) {
        console.error("Error in transformFromSdkResponse:", error);
        // Return a minimal valid response object
        return {
            candidates: [{
                    content: {
                        parts: [{
                                text: "[Error processing response: " + (error instanceof Error ? error.message : "Unknown error") + "]"
                            }]
                    }
                }]
        };
    }
}
//# sourceMappingURL=sdk-mapper.js.map