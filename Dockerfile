FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG MEDUSA_BACKEND_URL=https://api.monvesta.de
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL

RUN npx medusa build

RUN cd .medusa/server && npm install --legacy-peer-deps

EXPOSE 9000

CMD ["sh", "-c", "cd .medusa/server && npx medusa db:migrate && npm run start"]
