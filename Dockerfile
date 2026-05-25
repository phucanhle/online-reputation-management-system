# Stage 1: Build dependencies and compile application
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies required for native Node modules if any
RUN apk add --no-cache libc6-compat

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm ci

# Copy codebase and compile
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1

# Disable build-time connection requirements
ENV MONGODB_URI "mongodb://localhost:27017/reviews"
ENV API_SERVER_URL "https://server-crawl.lpa.io.vn"

RUN npm run build

# Stage 2: Minimal runtime image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential build outputs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "run", "start"]
