# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY tsconfig.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/

# Generate prisma client and compile typescript
RUN npx prisma generate && \
    npm run build && \
    npm prune --production

# Stage 2: Runtime stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Copy production packages and compiled JS
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
