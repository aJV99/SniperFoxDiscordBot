# Multi-stage build for smaller image size
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript (set DOCKER_BUILD to skip .env check)
ENV DOCKER_BUILD=true
RUN pnpm build

# Production stage
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create data directory for persistence
RUN mkdir -p /app/data

# Set environment to production
ENV NODE_ENV=production

# Run the bot
CMD ["pnpm", "start"]
