# GemForge (Gemini Tools)
<img src="https://github.com/user-attachments/assets/8cee4293-b0e0-461f-a9d9-f750397aa2b5" alt="GemForgeLogo" width="100" height="100">

<img src="https://glama.ai/mcp/servers/@PV-Bhat/GemForge-MCP/badge" alt="Glama Badge" width="210" height="110">

[![Smithery Badge](https://smithery.ai/badge/@PV-Bhat/gemforge-gemini-tools-mcp)](https://smithery.ai/server/@PV-Bhat/gemforge-gemini-tools-mcp)
[![MCP.so](https://img.shields.io/badge/MCP-Directory-blue)](https://mcp.so/server/gemforge-gemini-tools-mcp/PV-Bhat)

**GemForge-Gemini-Tools-MCP**: Enterprise-grade Gemini integration for your favorite MCP agents. Supercharge Claude, Roo Code, and Windsurf with codebase analysis, live search, text/PDF/image processing, and more.

## Quick Navigation

- [Features](#why-gemforge)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Tools](#key-tools)
- [Heavy-Duty Reliability](#heavy-duty-reliability)
- [Deployment](#deployment)
- [Examples](#examples)
- [Community](#community--support)
- [Documentation](#documentation)

## Why GemForge?

GemForge is the essential bridge between Google's Gemini AI and the MCP ecosystem:
![gemfog](https://github.com/user-attachments/assets/18cee069-d176-40c8-8ff9-3d643d918bc4)

- **Real-Time Web Access**: Fetch breaking news, market trends, and current data with `gemini_search`
- **Advanced Reasoning**: Process complex logic problems with step-by-step thinking via `gemini_reason`
- **Code Mastery**: Analyze full repositories, generate solutions, and debug code with `gemini_code`
- **Multi-File Processing**: Handle 60+ file formats including PDFs, images, and more with `gemini_fileops`

- **Intelligent Model Selection**: Automatically routes to optimal Gemini model for each task
  
- **Enterprise-Ready**: Robust error handling, rate limit management, and API fallback mechanisms

## Quick Start

### One-Line Install

```bash
npx @gemforge/mcp-server@latest init
```

### Manual Setup

1. Create configuration file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "GemForge": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

2. Install and run:

```bash
npm install gemforge-mcp
npm start
```

[Watch 30-second setup demo →](https://www.youtube.com/your-demo-link)

## Heavy-Duty Reliability

GemForge is built for production environments:

- **Support for 60+ File Types**: Process everything from code to documents to images
- **Automatic Model Fallbacks**: Continues functioning even during rate limits or service disruptions
- **Enterprise-Grade Error Logging**: Detailed diagnostics for troubleshooting
- **API Resilience**: Exponential backoff, retry logic, and seamless model switching
- **Full Repository Support**: Analyze entire codebases with configurable inclusion/exclusion patterns
- **XML Content Processing**: Specialized handling for structured data

## Key Tools

| Tool | Description | Key Capability |
|------|-------------|----------------|
| `gemini_search` | Web-connected information retrieval | Real-time data access |
| `gemini_reason` | Complex problem solving with step-by-step logic | Transparent reasoning process |
| `gemini_code` | Deep code understanding and generation | Full repository analysis |
| `gemini_fileops` | Multi-file processing across 60+ formats | Document comparison and transformation |

<details>
<summary><strong>Example: Real-Time Search</strong></summary>

```json
{
  "toolName": "gemini_search",
  "toolParams": {
    "query": "Latest advancements in quantum computing",
    "enable_thinking": true
  }
}
```
</details>

<details>
<summary><strong>Example: Code Analysis</strong></summary>

```json
{
  "toolName": "gemini_code",
  "toolParams": {
    "question": "Identify improvements and new features",
    "directory_path": "path/to/project",
    "repomix_options": "--include \"**/*.js\" --no-gitignore"
  }
}
```
</details>

<details>
<summary><strong>Example: Multi-File Comparison</strong></summary>

```json
{
  "toolName": "gemini_fileops",
  "toolParams": {
    "file_path": ["contract_v1.pdf", "contract_v2.pdf"],
    "operation": "analyze",
    "instruction": "Compare these contract versions and extract all significant changes."
  }
}
```
</details>

## Configuration

GemForge offers flexible configuration options:

<details>
<summary><strong>Environment Variables</strong></summary>

```
GEMINI_API_KEY=your_api_key_here       # Required: Gemini API key
GEMINI_PAID_TIER=true                  # Optional: Set to true if using paid tier (better rate limits)
DEFAULT_MODEL_ID=gemini-2.5-pro        # Optional: Override default model selection
LOG_LEVEL=info                         # Optional: Set logging verbosity (debug, info, warn, error)
```
</details>

<details>
<summary><strong>Claude Desktop Integration</strong></summary>

```json
{
  "mcpServers": {
    "GemForge": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```
</details>

<details>
<summary><strong>Advanced Model Selection</strong></summary>

GemForge intelligently selects the best model for each task:
- `gemini_search`: Uses `gemini-2.5-flash` for speed and search integration
- `gemini_reason`: Uses `gemini-2.5-pro` for deep reasoning capabilities
- `gemini_code`: Uses `gemini-2.5-pro` for complex code understanding
- `gemini_fileops`: Selects between `gemini-2.0-flash-lite` or `gemini-1.5-pro` based on file size

Override with `model_id` parameter in any tool call or set `DEFAULT_MODEL_ID` environment variable.
</details>

## Deployment

### Smithery.ai
One-click deployment via [Smithery.ai](https://smithery.ai/server/@PV-Bhat/gemforge-gemini-tools-mcp)

### Docker
```bash
docker run -e GEMINI_API_KEY=your_api_key ghcr.io/pv-bhat/gemforge:latest
```

### Self-Hosted
Use our [MCP.so Directory listing](https://mcp.so/server/gemforge-gemini-tools-mcp/PV-Bhat) for integration instructions.

## What Sets GemForge Apart?

- **Cross-Ecosystem Power**: Bridge Google's AI with Claude and other MCP agents
- **Multi-File Analysis**: Compare documents, images, or code versions
- **Smart Routing**: Automatic model selection based on task requirements
- **Production-Ready**: Built for enterprise environments

![GemForge in Action](docs/assets/gemforge-demo.gif)

## Community & Support

- **Join Us**: [MCP Discord](https://discord.me/mcp) | [GemForge Discord](https://discord.gg/your-invite-link)
- **Contribute**: [GitHub Discussions](https://github.com/your-username/GemForge/discussions)
- **Feedback**: Open an issue or share thoughts on Discord

## Documentation

Visit our [Documentation Site](https://your-username.github.io/GemForge) for:
- Advanced usage tutorials
- API reference
- Troubleshooting tips

## License

Licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

Powered by the [Gemini API](https://cloud.google.com/gemini) and inspired by the [Model Context Protocol](https://modelcontextprotocol.io).
