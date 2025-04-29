FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./
COPY tsconfig.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install

# Copy application code
COPY . .

# Build the application
RUN pnpm run build

# Set environment variables with defaults
ENV NODE_ENV=production

# Create a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Run the server using stdio transport
CMD ["node", "dist/index.js"]
