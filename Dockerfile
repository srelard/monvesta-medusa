FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# Install server dependencies during build
RUN cd .medusa/server && npm install --legacy-peer-deps || true

FROM node:22-slim

WORKDIR /app

# Copy built server
COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy source files (for seeds, custom scripts, migrations)
COPY --from=builder /app/src ./src
COPY --from=builder /app/medusa-config.ts ./medusa-config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 9000

CMD ["sh", "-c", "cd .medusa/server && npx medusa db:migrate && npm run start"]
