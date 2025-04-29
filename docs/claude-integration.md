# Claude Desktop Integration Guide

This guide explains how to integrate GemForge-MCP with Claude Desktop for enhanced AI capabilities.

## Integration Steps

### Method 1: Local Installation

1. **Install the GemForge-MCP server locally**:
   ```bash
   git clone https://github.com/PV-Bhat/gemini-tools-gemforge.git
   cd gemini-tools-gemforge
   npm install
   npm run build
   ```

2. **Configure Claude Desktop**:
   
   Edit your Claude Desktop configuration file:
   
   - On Windows: `%APPDATA%\claude-desktop\config.json`
   - On macOS: `~/Library/Application Support/claude-desktop/config.json`
   - On Linux: `~/.config/claude-desktop/config.json`
   
   Add the following configuration:
   
   ```json
   {
     "gemini_tools": {
       "command": "node C:/path/to/gemini-tools-gemforge/dist/index.js",
       "env": {
         "GEMINI_API_KEY": "your_gemini_api_key_here",
         "GEMINI_PAID_TIER": "false",
         "DEFAULT_MODEL_ID": "gemini-2.5-flash-preview-04-17"
       }
     }
   }
   ```
   
   Replace `C:/path/to/gemini-tools-gemforge` with the actual path to your local installation.

3. **Restart Claude Desktop**

4. **Test the integration**:
   
   Ask Claude to use one of the GemForge tools:
   ```
   Could you use the gemini_search tool to find information about climate change?
   ```

### Method 2: Using Smithery.ai (Recommended)

1. **Deploy GemForge-MCP on Smithery.ai** (follow the steps in DEPLOYMENT.md)

2. **Get your Smithery tool URL**:
   
   After deployment, Smithery will provide a URL for your tool, like:
   `https://api.smithery.ai/v1/tools/your-username/gemforge-mcp`

3. **Configure Claude Desktop**:
   
   Edit your Claude Desktop configuration file and add:
   
   ```json
   {
     "gemini_tools": {
       "command": "npx @smithery/cli run your-username/gemforge-mcp",
       "env": {}
     }
   }
   ```
   
   Replace `your-username` with your actual Smithery username.

4. **Restart Claude Desktop**

5. **Test the integration** as described above

## Available Tools

GemForge-MCP provides several powerful tools that Claude can use:

1. **gemini_search**: Get up-to-date information using Google's Gemini model with search capabilities
2. **gemini_reason**: Solve complex problems with step-by-step reasoning
3. **gemini_code**: Analyze codebases with Gemini's code understanding
4. **gemini_fileops**: Process files of various types including text, PDFs, and images

## Troubleshooting

### Common Issues

1. **"MCP Error -32001: Request Timed Out"**:
   - Check that Claude Desktop can reach the MCP server
   - Verify the API key is correct in your configuration
   - Make sure all paths in the command are correct

2. **Claude doesn't respond or recognizes the tool**:
   - Check the Claude Desktop logs for any errors
   - Make sure the tool name used in your prompt matches exactly (e.g., `gemini_search`, not `geminiSearch`)
   - Restart Claude Desktop after making configuration changes

3. **Server crashes silently**:
   - Check that the GEMINI_API_KEY environment variable is set correctly
   - Look for error logs in your terminal or console

### Getting Help

If you encounter issues not covered here, please:
1. Check the [GitHub repository issues](https://github.com/PV-Bhat/gemini-tools-gemforge/issues)
2. Create a new issue with detailed information about your problem
