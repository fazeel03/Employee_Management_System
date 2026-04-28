# Dockerfile - employee-api (Node.js)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]
