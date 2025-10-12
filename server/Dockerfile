# Dockerfile for SwiftPay Backend
FROM node:18-alpine

WORKDIR /app

# Copy package files (context is server/ when Root Directory is set)
COPY package*.json ./

# Install dependencies (include dev deps to compile TypeScript)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]

