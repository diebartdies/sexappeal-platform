# Use an official, lightweight Node.js runtime
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Chromium + runtime libs for whatsapp-web.js / puppeteer on Alpine (musl).
# Puppeteer's bundled Chromium download does not run on Alpine, so we install
# the system chromium package and point puppeteer at it.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Skip puppeteer's own Chromium download (set before npm install so the
# postinstall step honors it) and use the system chromium at runtime. The path
# matches the candidate list in utils/browserExecutable.js (PUPPETEER_EXECUTABLE_PATH).
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Skip Twilio npm package in production images until WhatsApp Business / SMS sender
# is configured. Override at build time: INSTALL_TWILIO=0 docker compose build app
ARG INSTALL_TWILIO=1

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --omit=dev --omit=optional --loglevel=error --fund=false \
    && npm audit fix --omit=dev || true
RUN if [ "$INSTALL_TWILIO" = "1" ]; then \
      npm install twilio@^6.0.2 --omit=dev --no-fund --loglevel=error \
      && npm audit fix --omit=dev || true; \
    else \
      echo "Twilio package skipped (INSTALL_TWILIO=0). SMS disabled until you rebuild with INSTALL_TWILIO=1."; \
    fi

# Upgrade Alpine packages to fix any lingering OS-level vulnerabilities
RUN apk upgrade --no-cache

# Copy the rest of the application code
COPY . .

# Ensure the uploads directory exists and set correct permissions
RUN mkdir -p public/uploads/photos

EXPOSE 5000
CMD ["node", "server.js"]