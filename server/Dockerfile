# syntax=docker/dockerfile:1

############################
# 1) Install dev deps (build)
############################
FROM node:22-bookworm-slim AS devdeps
WORKDIR /app

# Install all deps (including dev) for building TS
COPY package.json package-lock.json ./
RUN npm ci

############################
# 2) Build (TS -> dist)
############################
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=devdeps /app/node_modules ./node_modules
# Copy the rest of the backend source
COPY . .

# If tsconfig.json exists, build; otherwise no-op (JS projects)
RUN if [ -f tsconfig.json ]; then npm run build; else echo "No TS build step"; fi

############################
# 3) Runtime (prod only)
############################
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Change if your API uses a different port
ENV PORT=8080

# Create non-root user
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs appuser
USER appuser

# Install only production deps for a slim runtime
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled app (if TS) or source (if JS)
# Prefer dist/index.js (TS build); fallback to index.js (plain JS)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.js ./index.js

# If you have other runtime assets (e.g., email templates) not in dist,
# copy them explicitly here, e.g.:
# COPY --from=builder /app/templates ./templates

EXPOSE 8080
CMD ["bash", "-lc", "if [ -f dist/index.js ]; then node dist/index.js; else node index.js; fi"]
