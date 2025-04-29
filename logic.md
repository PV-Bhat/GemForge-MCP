# Gemini Tools (GemForge) MCP: Codebase Logic and Implementation

## Overview

Gemini Tools (GemForge) MCP (Multi-Channel Provider) is a specialized server that provides access to Google's Gemini AI models through a set of optimized tools. It handles model selection, request formatting, response processing, and error handling to provide a seamless experience for users.

## Core Components

### 1. Specialized Tools

The server implements four specialized tools, each optimized for specific use cases:

- **`gemini_search`**: For search-enabled queries using Gemini 2.0 Flash
- **`gemini_reason`**: For complex reasoning tasks using Gemini 2.5 Pro/Flash
- **`gemini_code`**: For code analysis using Gemini 2.5 Pro/Flash
- **`gemini_fileops`**: For file operations using Gemini 2.0 Flash-Lite

### 2. Model Selection Logic

The model selection logic follows a priority-based approach:

1. User-provided `model_id` (highest priority)
2. Tool-specific default models:
   - `gemini_search`: Gemini 2.0 Flash
   - `gemini_reason`: Gemini 2.5 Pro
   - `gemini_code`: Gemini 2.5 Pro
   - `gemini_fileops`: Gemini 2.0 Flash-Lite (or Gemini 1.5 Pro for large context)
3. Capability level mapping (for legacy support)

### 3. Fallback Mechanism

The system implements a robust fallback mechanism to handle unavailable models:

- Explicit fallbacks defined in `MODEL_FALLBACKS` object
- Rate limit detection and automatic retry with alternative models
- For 2.5 Pro models, automatic fallback to 2.5 Flash when rate limited

### 4. Request Building

Each tool has a specialized request builder that:

1. Constructs appropriate system prompts
2. Formats user queries
3. Handles file attachments
4. Sets appropriate generation parameters

### 5. Response Formatting

The response formatter:

1. Extracts text from model responses
2. Handles multimodal responses (text + vision)
3. Adds model information to the output
4. Formats responses for consistent display

## Key Features

### 1. Intelligent File Handling

- Special handling for different file types (XML, JSON, YAML, etc.)
- Conversion of problematic MIME types to text/plain for better compatibility
- Specialized handling for Repomix XML files in code analysis

### 2. Rate Limit Handling

- Detection of rate limit errors
- Exponential backoff with jitter for retries
- Automatic fallback to alternative models

### 3. Model Information Display

- Clear display of which model was used at the start of each response
- Inclusion of model information in response metadata

### 4. Enhanced System Prompts

Each tool uses a specialized system prompt optimized for its specific task:

- **Search**: Information Synthesizer role with Google Search integration
- **Reason**: Logical Problem Solver role with step-by-step reasoning
- **Code**: Code Analyzer role for technical analysis of codebases
- **Fileops**: Content Executor role for file operations

## Implementation Details

### 1. Model Selection (`src/utils/model-selector.ts`)

- `selectToolModel`: Selects the appropriate model based on tool name
- `selectModelId`: Main entry point for model selection
- `getUsableModelId`: Handles fallbacks for unavailable models

### 2. Request Building (`src/utils/request-builder.ts`)

- `buildSearchRequest`: Builds requests for search operations
- `buildReasoningRequest`: Builds requests for reasoning operations
- `buildCodeRequest`: Builds requests for code analysis
- `buildFileopsRequest`: Builds requests for file operations

### 3. Response Formatting (`src/utils/response-formatter.ts`)

- `formatResponse`: Formats responses for consistent display
- Handles different response types (text, vision, etc.)
- Adds model information to responses

### 4. File Handling (`src/utils/file-handler.ts`)

- `getMimeType`: Determines MIME type for files
- `getFileTypeCategory`: Categorizes files for specialized handling
- `preparePartsWithFiles`: Prepares file parts for requests

### 5. SDK Mapping (`src/utils/sdk-mapper.ts`)

- `transformToSdkFormat`: Transforms internal requests to SDK format
- `transformFromSdkResponse`: Transforms SDK responses to internal format
- Special handling for different file types

### 6. API Execution (`src/utils/api-executor.ts`)

- `executeRequest`: Executes requests against the Gemini API
- Handles rate limit errors and retries
- Implements fallback logic for 2.5 Pro models

## Recent Improvements

1. Updated model selection logic to use the correct models:
   - 2.5 models for code and reason only
   - 2.0 flash for search
   - 2.0 flash lite for fileops

2. Added retry logic for rate limit errors:
   - Automatic fallback from 2.5 Pro to 2.5 Flash

3. Improved file handling:
   - Better handling of XML, JSON, and YAML files
   - Conversion of problematic MIME types to text/plain

4. Enhanced system prompts:
   - Updated prompts for each tool based on best practices
   - Added model information to system prompts

5. Improved response formatting:
   - Clear display of model information at the start of each response
   - Consistent formatting across all tools

## Future Improvements

1. Add more detailed logging for better debugging
2. Implement more sophisticated retry logic
3. Add unit tests for core functionality
4. Improve error handling for edge cases
5. Add more documentation
