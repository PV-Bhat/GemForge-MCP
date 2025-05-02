Here’s your `.md` file, polished for maximum clarity, consistency, and presentation-quality Markdown formatting while preserving all functionality:

```markdown
# 🌌 GemForge: The Gemini-Claude Connector

[![Smithery Badge](https://smithery.ai/badge/@PV-Bhat/gemforge-gemini-tools-mcp)](https://smithery.ai/server/@PV-Bhat/gemforge-gemini-tools-mcp)
[![Glama Badge](https://glama.ai/mcp/servers/@PV-Bhat/GemForge-MCP/badge)](https://glama.ai/mcp/servers/@PV-Bhat/GemForge-MCP)
[![MCP Directory](https://img.shields.io/badge/MCP-Directory-blue)](https://mcp.so/server/gemforge-gemini-tools-mcp/PV-Bhat)
[![Build Status](https://img.shields.io/github/workflow/status/your-username/GemForge/CI)](https://github.com/your-username/GemForge/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/123456789012345678?label=Join%20Discord)](https://discord.me/mcp)

> **GemForge-Gemini-Tools-MCP** powers enterprise-grade Gemini integration for MCP agents — enabling seamless file analysis, live search, code reasoning, and cross-agent workflows with Claude, Roo Code, Windsurf, and beyond.

---

## ✨ Features at a Glance

- **Intelligent Model Routing** — Auto-selects optimal Gemini model per task
- **Multi-Format Support** — 60+ file types including code, PDFs, images, and specialized docs
- **Robust Error Handling** — Rate-limiting, exponential backoff, and failover logic
- **Multi-File Workflows** — Cross-compare codebases or analyze doc sets intelligently
- **Enterprise-Ready** — Logging, monitoring, compatibility across model families
- **Manual Overrides** — Explicit Gemini model selection when needed

---

## 🛠️ Core Tooling

| Tool              | Function                            | Use Case                                   |
|------------------|-------------------------------------|--------------------------------------------|
| `gemini_search`  | Real-time internet search           | Track breaking news, verify claims         |
| `gemini_reason`  | Step-by-step logical problem solving| Multi-step logic, deduction tasks          |
| `gemini_code`    | Full codebase analysis + generation | Repo-level understanding, refactoring      |
| `gemini_fileops` | Multi-file processing/comparison    | Diff PDFs, annotate images, batch tasks    |

---

## 🚀 Quick Start

### Requirements

- Node.js `v16+`
- Gemini API key from [Google AI Studio](https://cloud.google.com/gemini)

### Install and Launch

```bash
npm install -g gemforge-mcp
gemforge-mcp --api-key=YOUR_GEMINI_API_KEY
```

---

### 🔌 Claude Desktop Integration

<details>
<summary>Expand Claude Desktop config</summary>

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

---

### 🐳 Docker

<details>
<summary>Expand Docker setup</summary>

```bash
docker run -e GEMINI_API_KEY=your_api_key ghcr.io/pv-bhat/gemforge-mcp:latest
```
</details>

📺 [Watch the 30-second quick-start video →](https://www.youtube.com/your-demo-link)

---

## 💡 Tool Usage Examples

<details>
<summary><b>Search with Gemini</b> — Web-scraped real-time info</summary>

```json
{
  "toolName": "gemini_search",
  "toolParams": {
    "query": "Latest developments in quantum computing",
    "enable_thinking": true
  }
}
```
</details>

<details>
<summary><b>Reasoning Chain</b> — Solve multi-step logic problems</summary>

```json
{
  "toolName": "gemini_reason",
  "toolParams": {
    "problem": "A train travels at 60 mph for 2 hours, then 75 mph for 3 hours. What's the average speed?",
    "show_steps": true
  }
}
```
</details>

<details>
<summary><b>Code Intelligence</b> — Diagnose full repositories</summary>

```json
{
  "toolName": "gemini_code",
  "toolParams": {
    "question": "Identify performance bottlenecks in this codebase",
    "directory_path": "/path/to/project",
    "repomix_options": "--include \"**/*.js,**/*.ts\" --no-default-patterns"
  }
}
```
</details>

<details>
<summary><b>FileOps</b> — Compare PDFs or media</summary>

```json
{
  "toolName": "gemini_fileops",
  "toolParams": {
    "file_path": [
      "/path/to/contract_v1.pdf", 
      "/path/to/contract_v2.pdf"
    ],
    "operation": "compare",
    "instruction": "Identify all significant changes between these contract versions"
  }
}
```
</details>

---

## ⚙️ Advanced Configuration

<details>
<summary>Environment Variables</summary>

```bash
GEMINI_API_KEY=your_gemini_api_key
GEMINI_PAID_TIER=true
DEFAULT_MODEL_ID=gemini-2.5-flash-preview-04-17
LOG_LEVEL=info
ENABLE_METRICS=true
MAX_RETRIES=5
FALLBACK_STRATEGY=cascade
```
</details>

<details>
<summary>Full Config (gemforge.config.js)</summary>

```js
module.exports = {
  api: {
    key: process.env.GEMINI_API_KEY,
    paidTier: true,
    defaultModel: "gemini-2.5-flash-preview-04-17"
  },
  logging: {
    level: "info",
    format: "json",
    destination: "console"
  },
  fallbacks: {
    enabled: true,
    strategy: "cascade",
    maxRetries: 3
  },
  tools: {
    search: {
      defaultThinking: true
    },
    code: {
      repomixDefaults: "--include \"**/*.{js,ts,py,java}\" --exclude \"**/node_modules/**\""
    }
  }
};
```
</details>

---

## 📦 Deployment Options

### Smithery (Recommended)

[Deploy now via Smithery →](https://smithery.ai/server/@PV-Bhat/gemforge-gemini-tools-mcp)

### Self-Hosted (Docker/Kubernetes)

<details>
<summary>Kubernetes Manifest</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gemforge-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gemforge-mcp
  template:
    metadata:
      labels:
        app: gemforge-mcp
    spec:
      containers:
      - name: gemforge-mcp
        image: ghcr.io/pv-bhat/gemforge-mcp:latest
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemforge-secrets
              key: gemini-api-key
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
```
</details>

---

## 🌟 Why GemForge?

- **Unified Agent Interface** — Claude, Gemini, and custom MCP agents under one roof
- **Cross-Modal Proficiency** — Analyze and synthesize text, code, PDFs, and images
- **API Resilience** — Built-in retries and graceful degradation
- **Intelligent Task Routing** — Dynamically selects best-fit model per operation
- **Enterprise Compliance** — Logs, rate control, fallback systems baked in

---

## 📚 Resources

- 📖 [Full Docs](https://docs.gemforge-mcp.dev)
- 📘 [API Reference](https://docs.gemforge-mcp.dev/api)
- 🛠 [Integration Guides](https://docs.gemforge-mcp.dev/integration)
- 💬 [Join the Discord](https://discord.gg/your-invite-link)
- 🐞 [GitHub Issues](https://github.com/your-username/GemForge/issues)

---

## 🏢 Enterprise Support

- SLAs + Uptime Guarantees
- Custom Model Routing
- Deployment Assistance
- Security & Compliance Integration

📬 [Contact us →](mailto:enterprise@gemforge-mcp.dev)

---

## 📄 License

[MIT License](LICENSE) — Open-source and free for commercial use.

---

<p align="center">
  <strong>Unleash your AI agents with full-stack Gemini tooling</strong><br>
  <a href="https://mcp.so/server/gemforge-gemini-tools-mcp/PV-Bhat">MCP Directory</a> • 
  <a href="https://smithery.ai/server/@PV-Bhat/gemforge-gemini-tools-mcp">Smithery</a> • 
  <a href="https://discord.me/mcp">Join the Discord</a>
</p>
```

Let me know if you want this adapted into a `README.md` template for a GitHub repo structure or if you'd like me to generate a downloadable file.
