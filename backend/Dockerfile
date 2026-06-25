# syntax=docker/dockerfile:1

FROM node:20.20.2-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20.20.2-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY database ./database
COPY scripts/run-migrations.mjs ./scripts/run-migrations.mjs
COPY scripts/bootstrap-schema.mjs ./scripts/bootstrap-schema.mjs
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
