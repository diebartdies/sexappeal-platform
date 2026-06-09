# Use an official, lightweight Node.js runtime
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --omit=dev --loglevel=error

# Upgrade Alpine packages to fix any lingering OS-level vulnerabilities
RUN apk upgrade --no-cache

# Copy the rest of the application code
COPY . .

# Ensure the uploads directory exists and set correct permissions
RUN mkdir -p public/uploads/photos

EXPOSE 5000
CMD ["node", "server.js"]