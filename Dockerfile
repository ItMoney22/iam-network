# Build stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Clean install with all dependencies
RUN rm -rf node_modules package-lock.json && npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts || npm install --only=production

# Copy built application and assets from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway sets PORT env variable)
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
