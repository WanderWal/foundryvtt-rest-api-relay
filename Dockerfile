FROM node:25-slim

WORKDIR /app

# Install required build dependencies for bcrypt, PostgreSQL, SQLite3, and Puppeteer (Chromium)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    postgresql-client \
    sqlite3 \
    libsqlite3-dev \
    pkg-config \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    git \
    # Add chromium-browser package
    chromium \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json (and lock files if they exist)
COPY package.json ./ 
COPY bun.lockb* ./
COPY bun.lock* ./
COPY yarn.lock* ./ 
COPY package-lock.json* ./ 

# Install dependencies with --no-optional to avoid non-essential optional deps
RUN npm install -g bun && \
    if [ -f bun.lockb ] || [ -f bun.lock ]; then \
      bun install --frozen-lockfile; \
    else \
      bun install; \
    fi

# Add node-fetch explicitly since it's needed for the forwarder
RUN bun add node-fetch @types/node-fetch

# Force rebuild SQLite3 from source for the current platform
RUN npm rebuild sqlite3 --build-from-source
RUN cd node_modules/sqlite3 && npm run install --build-from-source

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY tsconfig.json ./

# Build the application first
RUN bun run build

# Try to build docs if possible, but don't fail the build if it doesn't work
COPY docs/ ./docs/
RUN if [ -d "docs" ] && [ -f "docs/package.json" ]; then \
      echo "Attempting to build documentation..." && \
      (cd docs && bun install && bun run build) || echo "Documentation build failed, continuing without docs"; \
    else \
      echo "Skipping documentation build"; \
    fi

# Set environment variables
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    DB_TYPE=sqlite

# Create data directory for SQLite
RUN mkdir -p /app/data && chmod 755 /app/data

# Expose port
EXPOSE 3010

# Start the application
CMD ["node", "dist/index.js"]
