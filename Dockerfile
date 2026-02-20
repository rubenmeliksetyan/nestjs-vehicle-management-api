FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nestjs:nodejs /app/database ./database
COPY --from=builder --chown=nestjs:nodejs /app/.sequelizerc ./.sequelizerc
COPY --chown=nestjs:nodejs .env.example ./.env.example

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/main.js"]
