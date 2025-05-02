# GemForge-mcp

GemForge-mcp is a professional Gemini API integration for Claude and MCP-compatible hosts with intelligent model selection and advanced file handling capabilities.

<a href="https://glama.ai/mcp/servers/@PV-Bhat/GemForge-MCP">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@PV-Bhat/GemForge-MCP/badge" alt="GemForge-Gemini-Tools-MCP MCP server" />
</a>

## Overview

GemForge-mcp provides a Model Context Protocol (MCP) server that offers specialized tools for interacting with Google's Gemini AI models. It features intelligent model selection based on task type and content, advanced file handling, and optimized prompts for different use cases.

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/GemForge-mcp.git
cd GemForge-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_MODEL_ID=gemini-2.5-flash-preview-04-17  # Optional
GEMINI_PAID_TIER=false  # Set to 'true' if using paid tier
```

## Running the Server

```bash
# Run from source (development)
npm run start

# Run from compiled JavaScript (production)
npm run start:dist
```

## Smithery.ai Deployment

This repository includes the necessary configuration for deploying the GemForge MCP server on [smithery.ai](https://smithery.ai).

### Smithery Configuration

The `smithery.yaml` file contains the configuration needed for smithery deployment:

```yaml
# Smithery.ai configuration
startCommand:
  type: stdio
  configSchema:
    type: object
    properties:
      GEMINI_API_KEY:
        type: string
        description: "Google Gemini API key"
      GEMINI_PAID_TIER:
        type: boolean
        description: "Whether using paid tier (for rate limits)"
        default: false
      DEFAULT_MODEL_ID:
        type: string
        description: "Default Gemini model ID to use"
        default: "gemini-2.5-flash-preview-04-17"
    required:
      - GEMINI_API_KEY
  # Command function that generates the startup command
  commandFunction: |-
    (config) => ({
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GEMINI_API_KEY": config.GEMINI_API_KEY,
        "GEMINI_PAID_TIER": config.GEMINI_PAID_TIER ? "true" : "false",
        "DEFAULT_MODEL_ID": config.DEFAULT_MODEL_ID || "gemini-2.5-flash-preview-04-17"
      }
    })

# Docker configuration
docker:
  image: gemforge-mcp:latest
  env:
    # Environment variables configured through smithery UI
```

### Deployment Steps

1. **Prepare Your Repository**:
   - Ensure your code is committed and pushed to GitHub
   - Verify the `smithery.yaml` file is properly configured

2. **Sign Up for Smithery**:
   - Create an account at [smithery.ai](https://smithery.ai)
   - Connect your GitHub account to smithery.ai

3. **Create a New Deployment**:
   - Select "New Tool" or equivalent option
   - Choose this repository from your GitHub repositories
   - Select the branch you want to deploy (usually `main` or `master`)

4. **Configure Environment Variables**:
   - Enter your `GEMINI_API_KEY` in the smithery.ai dashboard
   - Optionally configure `GEMINI_PAID_TIER` and `DEFAULT_MODEL_ID`

5. **Deploy**:
   - Initiate the deployment process
   - Smithery will build and deploy your MCP server

6. **Integration**:
   - Once deployed, smithery will provide integration instructions
   - Follow those instructions to connect the MCP server to your AI assistant

### Updates and Maintenance

- Push changes to your GitHub repository
- Smithery can be configured to automatically rebuild and deploy on changes
- Monitor your deployment through the smithery.ai dashboard

## Docker Deployment

### Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier management)
- A Google Gemini API key

### Building the Docker Image

```bash
# Using Docker directly
docker build -t gemforge-mcp .

# Using Docker Compose
docker-compose build
```

### Running the Container

```bash
# Using Docker directly
docker run -e GEMINI_API_KEY=your_api_key -e GEMINI_PAID_TIER=false -e DEFAULT_MODEL_ID=gemini-2.5-flash-preview-04-17 gemforge-mcp

# Using Docker Compose (after setting variables in .env file)
docker-compose up -d
```

### Docker Image Structure

The Dockerfile uses a multi-stage build process:

1. **Builder Stage**:
   - Uses Node.js Alpine as the base image
   - Installs all dependencies including dev dependencies
   - Builds the TypeScript code to JavaScript

2. **Production Stage**:
   - Uses a clean Node.js Alpine image
   - Creates a non-root user for improved security
   - Copies only the production dependencies and built code
   - Includes a health check for container monitoring

### Environment Variables

The Docker container requires the following environment variables:

- `GEMINI_API_KEY` (required): Your Google Gemini API key
- `GEMINI_PAID_TIER` (optional): Set to `true` if using paid tier (default: `false`)
- `DEFAULT_MODEL_ID` (optional): Default Gemini model ID (default: `gemini-2.5-flash-preview-04-17`)

These can be set in the `.env` file when using Docker Compose.

## Available Tools

GemForge-mcp provides four specialized tools for different AI tasks:

### 1. gemini_search

Generates responses based on the latest information using Gemini models with Google Search integration.

**Input Parameters:**
- `query` (string, required): Your search query or question
- `file_path` (string, optional): File path to include with the query
- `model_id` (string, optional): Model ID override
- `enable_thinking` (boolean, optional): Enable thinking mode for step-by-step reasoning

**Example:**
```json
{
  "toolName": "gemini_search",
  "toolParams": {
    "query": "What are the latest developments in quantum computing?",
    "enable_thinking": true
  }
}
```

### 2. gemini_reason

Solves complex problems with step-by-step reasoning using advanced Gemini models.

**Input Parameters:**
- `problem` (string, required): The complex problem or question to solve
- `file_path` (string, optional): File path to include with the problem
- `show_steps` (boolean, optional, default: false): Whether to show detailed reasoning steps
- `model_id` (string, optional): Model ID override

**Example:**
```json
{
  "toolName": "gemini_reason",
  "toolParams": {
    "problem": "If a rectangle has a perimeter of 30 units and its length is twice its width, what are the dimensions of the rectangle?",
    "show_steps": true
  }
}
```

### 3. gemini_code

Analyzes codebases using Repomix and Gemini models to answer questions about code structure, logic, and potential improvements.

**Input Parameters:**
- `question` (string, required): Question about the codebase
- `directory_path` (string, optional): Path to the code directory
- `codebase_path` (string, optional): Path to pre-packed Repomix file
- `repomix_options` (string, optional): Custom options for the Repomix command (for power users)
- `model_id` (string, optional): Model ID override

**Example:**
```json
{
  "toolName": "gemini_code",
  "toolParams": {
    "question": "What does this project do?",
    "codebase_path": "path/to/codebase.xml"
  }
}
```

**Example with custom Repomix options:**
```json
{
  "toolName": "gemini_code",
  "toolParams": {
    "question": "Analyze the log files in this directory",
    "directory_path": "path/to/logs",
    "repomix_options": "--include \"**/*.log\" --no-gitignore --no-default-patterns"
  }
}
```

### 4. gemini_fileops

Performs efficient operations on files (text, PDF, images, etc.) using appropriate Gemini models.

**Input Parameters:**
- `file_path` (string or array of strings, required): Path to the file(s)
- `instruction` (string, optional): Specific instruction for processing
- `operation` (string, optional): Specific operation type (`summarize`, `extract`, `analyze`)
- `use_large_context_model` (boolean, optional, default: false): Set true for very large files
- `model_id` (string, optional): Model ID override

**Single File Example:**
```json
{
  "toolName": "gemini_fileops",
  "toolParams": {
    "file_path": "path/to/document.pdf",
    "operation": "summarize"
  }
}
```

**Multiple Files Example:**
```json
{
  "toolName": "gemini_fileops",
  "toolParams": {
    "file_path": ["path/to/image1.jpg", "path/to/image2.jpg"],
    "operation": "analyze",
    "instruction": "Compare these images and describe the differences"
  }
}
```

**Important Notes for Multi-File Operations:**

1. **Path Format**: When passing multiple files as an array, use forward slashes (`/`) in the file paths, even on Windows systems:
   ```json
   "file_path": ["C:/Users/Username/Documents/file1.txt", "C:/Users/Username/Documents/file2.txt"]
   ```

2. **File Type Consistency**: For best results, use files of the same type in multi-file operations (e.g., all images, all text files).

3. **Custom Instructions**: When analyzing multiple files, provide a specific `instruction` parameter to guide the comparison or analysis.

4. **File Limit**: There is a practical limit to how many files can be processed at once, depending on their size and complexity. For large files, consider processing them individually or using `use_large_context_model: true`.

5. **Concatenation**: When multiple text files are provided, they are concatenated with clear separators before processing.

## Model Selection

GemForge-mcp implements intelligent model selection based on:

1. **Task Type**:
   - Search tasks: Prefers models with search capabilities
   - Reasoning tasks: Prefers models with strong reasoning abilities
   - Code analysis: Prefers models with code understanding
   - File operations: Selects based on file type and size

2. **Available Models**:
   - `FAST`: `gemini-2.0-flash-lite-001` - Fast, efficient model for simple tasks
   - `BALANCED`: `gemini-2.0-flash-001` - Balanced model for general-purpose use
   - `ADVANCED`: `gemini-2.5-pro-exp-03-25` - Advanced model for complex reasoning
   - `LARGE_CONTEXT`: `gemini-1.5-pro-002` - Model for very large context windows

## Special Features

1. **System Instruction Hoisting**: Properly handles system instructions for all Gemini models
2. **XML Content Processing**: Efficiently processes XML content for code analysis
3. **File Type Detection**: Automatically detects file types and selects appropriate models
4. **Rate Limiting Handling**: Implements exponential backoff and model fallbacks
5. **Error Recovery**: Provides meaningful error messages and recovery options
6. **Custom Repomix Options**: Allows power users to customize the Repomix command for code analysis, enabling fine-grained control over which files are included or excluded
7. **Multi-File Processing**: Supports analyzing multiple files in a single operation, enabling comparison and transformation analysis

## Advanced Usage

### Multi-File Analysis with gemini_fileops

The `gemini_fileops` tool supports analyzing multiple files in a single operation, which is particularly useful for:

1. **Comparison Analysis**: Compare multiple versions of a document or image
2. **Transformation Analysis**: Analyze changes or progression across a series of files
3. **Batch Processing**: Process multiple related files with a single instruction

**Example: Fitness Transformation Analysis**

```json
{
  "toolName": "gemini_fileops",
  "toolParams": {
    "file_path": [
      "C:/Users/Username/Images/fitness2020.jpg",
      "C:/Users/Username/Images/fitness2021.jpg",
      "C:/Users/Username/Images/fitness2022.jpg"
    ],
    "operation": "analyze",
    "instruction": "Analyze these fitness images and provide a detailed fitness transformation analysis. Compare the physique changes across the images, noting any improvements in muscle definition, body composition, and overall fitness level."
  }
}
```

**Example: Document Comparison**

```json
{
  "toolName": "gemini_fileops",
  "toolParams": {
    "file_path": [
      "C:/Users/Username/Documents/contract_v1.pdf",
      "C:/Users/Username/Documents/contract_v2.pdf"
    ],
    "operation": "extract",
    "instruction": "Compare these two contract versions and extract all significant changes between them. Highlight additions, deletions, and modifications."
  }
}
```

**Example: Code Evolution Analysis**

```json
{
  "toolName": "gemini_fileops",
  "toolParams": {
    "file_path": [
      "C:/Users/Username/Projects/v1/main.js",
      "C:/Users/Username/Projects/v2/main.js"
    ],
    "operation": "analyze",
    "instruction": "Analyze how this code has evolved between versions. Identify improvements, new features, bug fixes, and any potential issues introduced."
  }
}
```

## Development

### Project Structure

```
GemForge-mcp/
├── src/
│   ├── config/         # Configuration constants
│   ├── handlers/       # Tool handlers
│   ├── interfaces/     # TypeScript interfaces
│   ├── utils/          # Utility functions
│   └── index.ts        # Main entry point
├── test/
│   ├── fixtures/       # Test fixtures
│   └── test-*.ts       # Test files
├── dist/               # Compiled JavaScript files
├── .env                # Environment variables
├── package.json        # Project metadata
└── tsconfig.json       # TypeScript configuration
```

### Build Scripts

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm run test
```

## Troubleshooting

### Common Issues

1. **Module Not Found Errors**:
   - Ensure you've built the project with `npm run build`
   - Check that the path to the module is correct

2. **API Key Errors**:
   - Verify your Gemini API key is correctly set in the `.env` file
   - Check that the API key has the necessary permissions

3. **Rate Limiting**:
   - The server implements exponential backoff for rate limiting
   - Consider setting `GEMINI_PAID_TIER=true` if you're on a paid tier

4. **File Processing Issues**:
   - Ensure file paths are correct and accessible
   - Check file permissions
   - For large files, use `use_large_context_model: true`
   - For multi-file operations, use forward slashes (`/`) in file paths, even on Windows
   - When passing an array of files, ensure the array syntax is correct: `["path/to/file1.txt", "path/to/file2.txt"]`
   - If files aren't being loaded properly, try using absolute paths instead of relative paths

5. **Repomix File Inclusion Issues**:
   - By default, Repomix excludes certain file types (logs, binaries, etc.)
   - Use the `repomix_options` parameter to customize file inclusion/exclusion
   - For log files, try `repomix_options: "--include \"**/*.log\" --no-gitignore --no-default-patterns"`
   - For binary files, try `repomix_options: "--include-binary"`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for providing the underlying AI capabilities
- Model Context Protocol (MCP) for standardizing AI tool interfaces