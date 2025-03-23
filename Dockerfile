# Use Node.js LTS version on ARM64
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies required for Puppeteer and Chromium
RUN apt-get update \
    && apt-get install -y \
    sqlite3 \
    chromium \
    chromium-sandbox \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    fonts-liberation \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox" \
    PUPPETEER_HEADLESS=true

# Copy project files
COPY . .

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Add user for security
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run as non-privileged user
USER pptruser

# Expose port for API
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "api"]
