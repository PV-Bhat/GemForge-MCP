FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./
COPY tsconfig.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest

# Copy application code first to ensure TypeScript can find the files
COPY . .

# Install dependencies and build the application
RUN pnpm install && pnpm run build

# Set environment variables with defaults
ENV NODE_ENV=production

# Create a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Run the server using stdio transport
CMD ["node", "dist/src/index.js"]
