FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 9000

CMD ["sh", "-c", "npm run build && cd .medusa/server && npm install --legacy-peer-deps && npx medusa db:migrate && npm run start"]
