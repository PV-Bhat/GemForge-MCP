#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
// Import handlers
import { handleReason } from './handlers/unified-gemini.js';
import { handleDirectSearchAlt } from './handlers/direct-search-alt.js';
import { handleCode } from './handlers/code.js';
import { handleFileops } from './handlers/fileops.js';
import { TOOL_NAMES } from './config/constants.js';
// Load environment variables
dotenv.config();
// Verify API key is available
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
}
/**
 * Main server class for Gemini Tools (GemForge) MCP
 */
class GeminiServer {
    constructor() {
        this.server = new Server({
            name: 'gemini-tools-gemforge-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    /**
     * Sets up tool handlers for the MCP server
     */
    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: TOOL_NAMES.GEM_SEARCH,
                    description: 'Generates responses based on the latest information using Gemini 2.0 Flash and Google Search. Best for general knowledge questions, fact-checking, and information retrieval.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Your search query or question'
                            },
                            file_path: {
                                type: 'string',
                                description: 'Optional file path to include with the query'
                            },
                            model_id: {
                                type: 'string',
                                description: 'Optional model ID override (advanced users only)'
                            },
                            enable_thinking: {
                                type: 'boolean',
                                description: 'Enable thinking mode for step-by-step reasoning'
                            }
                        },
                        required: ['query'],
                    },
                },
                {
                    name: TOOL_NAMES.GEM_REASON,
                    description: 'Solves complex problems with step-by-step reasoning using Gemini 2.0 Flash Thinking. Best for math and science problems, coding challenges, and tasks requiring transparent reasoning process.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            problem: {
                                type: 'string',
                                description: 'The complex problem or question to solve'
                            },
                            file_path: {
                                type: 'string',
                                description: 'Optional file path to include with the problem'
                            },
                            show_steps: {
                                type: 'boolean',
                                description: 'Whether to show detailed reasoning steps (default: false)',
                                default: false
                            },
                            model_id: {
                                type: 'string',
                                description: 'Optional model ID override (advanced users only)'
                            }
                        },
                        required: ['problem'],
                    },
                },
                {
                    name: TOOL_NAMES.GEM_CODE,
                    description: 'Analyzes codebases using Repomix and Gemini 2.5 Pro. Answers questions about code structure, logic, and potential improvements.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            question: {
                                type: 'string',
                                description: 'Question about the codebase'
                            },
                            directory_path: {
                                type: 'string',
                                description: 'Path to the code directory'
                            },
                            codebase_path: {
                                type: 'string',
                                description: 'Path to pre-packed Repomix file'
                            },
                            model_id: {
                                type: 'string',
                                description: 'Optional model ID override (advanced users only)'
                            }
                        },
                        required: ['question'],
                    },
                },
                {
                    name: TOOL_NAMES.GEM_FILEOPS,
                    description: 'Performs efficient operations on files (text, PDF, images, etc.) using appropriate Gemini models (Flash-Lite or 1.5 Pro for large files). Use for summarization, extraction, or basic analysis.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            file_path: {
                                oneOf: [
                                    { type: 'string', description: 'Path to a single file' },
                                    { type: 'array', items: { type: 'string' }, description: 'Array of file paths' }
                                ],
                                description: 'Path to the file or array of file paths'
                            },
                            instruction: {
                                type: 'string',
                                description: 'Specific instruction for processing'
                            },
                            operation: {
                                type: 'string',
                                description: 'Specific operation type',
                                enum: ['summarize', 'extract', 'analyze']
                            },
                            use_large_context_model: {
                                type: 'boolean',
                                description: 'Set true if the file is very large to use Gemini 1.5 Pro',
                                default: false
                            },
                            model_id: {
                                type: 'string',
                                description: 'Optional model ID override (advanced users only)'
                            }
                        },
                        required: ['file_path'],
                    },
                },
            ],
        }));
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                // Log the incoming request for debugging
                console.error(`Received request for tool: ${request.params.name}`);
                // Handle specific unsupported methods with clear error messages
                if (request.params.name === 'resources/list') {
                    console.error('Client attempted to call unsupported method: resources/list');
                    throw new McpError(ErrorCode.MethodNotFound, `Method 'resources/list' is not supported by this server. Please use one of the available tools listed in the tools endpoint.`);
                }
                if (request.params.name === 'prompts/list') {
                    console.error('Client attempted to call unsupported method: prompts/list');
                    throw new McpError(ErrorCode.MethodNotFound, `Method 'prompts/list' is not supported by this server. Please use one of the available tools listed in the tools endpoint.`);
                }
                // Handle supported tools
                switch (request.params.name) {
                    case TOOL_NAMES.GEM_SEARCH:
                        // Use the alternative direct search handler that works with Flash models
                        return await handleDirectSearchAlt(request);
                    case TOOL_NAMES.GEM_REASON:
                        return await handleReason(request);
                    case TOOL_NAMES.GEM_CODE:
                        return await handleCode(request);
                    case TOOL_NAMES.GEM_FILEOPS:
                        return await handleFileops(request);
                    // Support legacy tool names for backward compatibility
                    case 'gemini_search':
                        // Use the alternative direct search handler that works with Flash models
                        return await handleDirectSearchAlt(request);
                    case 'gemini_reason':
                        return await handleReason(request);
                    default:
                        console.error(`Unknown tool requested: ${request.params.name}`);
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}. Available tools: gemini_search, gemini_reason, gemini_code, gemini_fileops`);
                }
            }
            catch (error) {
                console.error(`Error in tool handler for ${request.params.name}:`, error);
                if (error instanceof McpError) {
                    throw error;
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        });
    }
    /**
     * Starts the server
     */
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Gemini Tools (GemForge) MCP server running on stdio');
    }
}
/**
 * Create and run the server
 */
const server = new GeminiServer();
server.run().catch(error => {
    console.error('Fatal error starting server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map