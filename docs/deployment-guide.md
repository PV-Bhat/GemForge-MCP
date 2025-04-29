# GemForge-MCP Deployment Guide

This guide provides detailed instructions for deploying the GemForge-MCP server using Docker and Smithery.ai.

## Table of Contents

- [Docker Deployment](#docker-deployment)
  - [Prerequisites](#prerequisites)
  - [Configuration](#configuration)
  - [Building and Running with Docker](#building-and-running-with-docker)
  - [Building and Running with Docker Compose](#building-and-running-with-docker-compose)
  - [Troubleshooting Docker Deployment](#troubleshooting-docker-deployment)
- [Smithery.ai Deployment](#smitheryai-deployment)
  - [Prerequisites](#prerequisites-1)
  - [Preparing Your Repository](#preparing-your-repository)
  - [Deploying to Smithery.ai](#deploying-to-smitheryai)
  - [Configuring Your Deployment](#configuring-your-deployment)
  - [Integration with AI Assistants](#integration-with-ai-assistants)
  - [Troubleshooting Smithery Deployment](#troubleshooting-smithery-deployment)

## Docker Deployment

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (optional, for easier management)
- A Google Gemini API key

### Configuration

1. **Create Environment File**:
   
   Create a `.env` file in the root directory with the following variables:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_PAID_TIER=false  # Set to 'true' if using paid tier
   DEFAULT_MODEL_ID=gemini-2.5-flash-preview-04-17  # Optional
   ```

   **Important**: Never commit your actual API key to version control. The `.env` file is listed in `.gitignore` to prevent this.

### Building and Running with Docker

1. **Build the Docker Image**:

   ```bash
   docker build -t gemforge-mcp .
   ```

2. **Run the Container**:

   ```bash
   docker run -e GEMINI_API_KEY=your_api_key gemforge-mcp
   ```

   For more environment variables:

   ```bash
   docker run \
     -e GEMINI_API_KEY=your_api_key \
     -e GEMINI_PAID_TIER=false \
     -e DEFAULT_MODEL_ID=gemini-2.5-flash-preview-04-17 \
     gemforge-mcp
   ```

3. **Run the Container with HTTP Port** (if your service exposes an HTTP endpoint):

   ```bash
   docker run -p 8080:8080 -e GEMINI_API_KEY=your_api_key gemforge-mcp
   ```

### Building and Running with Docker Compose

1. **Ensure Environment Variables are Set**:
   
   Your `.env` file should contain all necessary variables (see [Configuration](#configuration)).

2. **Build and Start the Service**:

   ```bash
   docker-compose up -d
   ```

   This command builds the image if needed and starts the container in detached mode.

3. **View Logs**:

   ```bash
   docker-compose logs -f
   ```

4. **Stop the Service**:

   ```bash
   docker-compose down
   ```

### Troubleshooting Docker Deployment

#### Common Issues

1. **Build Errors**:
   - Ensure Docker has sufficient resources allocated
   - Check network connectivity for dependency downloads

2. **Run Errors**:
   - Verify your API key is correctly set
   - Check for port conflicts if exposing HTTP endpoints
   - Ensure you're using the correct environment variable names

3. **Container Crashes**:
   - Check logs with `docker logs <container_id>`
   - Verify the health check isn't failing (if enabled)

## Smithery.ai Deployment

### Prerequisites

- GitHub account with your GemForge-MCP repository
- Smithery.ai account
- Google Gemini API key

### Preparing Your Repository

1. **Update smithery.yaml**:

   Ensure your repository has a properly configured `smithery.yaml` file:

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
     commandFunction: |-
       (config) => ({
         "command": "node",
         "args": [
           "dist/index.js"
         ],
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
       # Environment variables will be configured through smithery's UI
     ports:
       - "8080:8080"  # If the service exposes any HTTP endpoints
   ```

2. **Commit and Push**:

   Ensure all your changes are committed and pushed to GitHub:

   ```bash
   git add .
   git commit -m "Prepare for smithery deployment"
   git push origin main
   ```

### Deploying to Smithery.ai

1. **Sign In to Smithery.ai**:
   
   Visit [smithery.ai](https://smithery.ai) and sign in with your account.

2. **Connect GitHub Account**:
   
   If not already connected, link your GitHub account to Smithery.

3. **Create New Tool**:

   - Click "New Tool" or equivalent button
   - Select your GitHub repository from the list
   - Choose the branch to deploy (usually `main` or `master`)

### Configuring Your Deployment

1. **Set Environment Variables**:

   Configure the required environment variables in the Smithery UI:
   
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `GEMINI_PAID_TIER`: Whether you're using the paid tier (boolean)
   - `DEFAULT_MODEL_ID`: Optional model ID override

2. **Deploy**:

   Click the deploy button to initiate the build and deployment process.

3. **Monitor Deployment**:

   Smithery will show build logs and deployment status. Wait for the deployment to complete.

### Integration with AI Assistants

Once your GemForge-MCP server is deployed on Smithery, you can integrate it with AI assistants:

1. **Copy Integration URL**:
   
   Smithery will provide an MCP URL for your deployed server.

2. **Configure AI Assistant**:
   
   Use this URL to configure your AI assistant to use your GemForge-MCP server.

3. **Test Integration**:
   
   Test your AI assistant to verify it can access the GemForge-MCP tools.

### Troubleshooting Smithery Deployment

#### Common Issues

1. **Build Failures**:
   - Check build logs for specific errors
   - Verify your `package.json` scripts are correct
   - Ensure all dependencies are properly declared

2. **Runtime Errors**:
   - Check if your API key is correctly configured
   - Verify Smithery can access your repository
   - Confirm your `smithery.yaml` is properly formatted

3. **Integration Issues**:
   - Ensure your AI assistant is correctly configured with the right URL
   - Check that your MCP server provides the expected tools
   - Verify network access between your AI assistant and the Smithery deployment

## Support and Additional Resources

If you encounter issues not covered in this guide, please:

1. Check the [GitHub repository issues](https://github.com/PV-Bhat/gemini-tools-gemforge/issues)
2. Consult [Smithery.ai documentation](https://smithery.ai/docs) for Smithery-specific issues
3. Refer to [Docker documentation](https://docs.docker.com/) for Docker-related questions
