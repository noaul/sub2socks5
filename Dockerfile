FROM node:22-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

WORKDIR /app/src

EXPOSE 18080

CMD ["node", "server.js"]
