FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --maxsockets 5

# Copy source code
COPY . .

# Build Medusa
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 9000

CMD ["sh", "-c", "cd .medusa/server && npm install && npm run predeploy && npm run start"]
