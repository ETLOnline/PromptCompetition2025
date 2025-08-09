# syntax=docker/dockerfile:1

#########################
# Backend (server/)     #
#########################
# Works for TypeScript or JavaScript projects.
# Expects a package.json in /server with scripts:
#  - "build" (for TS) producing ./dist
#  - "start": "node dist/index.js"   (TS)  OR "node index.js" (JS)
#
# If you run directly with ts-node in prod, consider compiling instead.

FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- deps ----
COPY package.json ./
COPY package-lock.json* ./
COPY pnpm-lock.yaml* ./
COPY yarn.lock* ./

RUN set -eux; \
    if [ -f pnpm-lock.yaml ]; then \
        npm i -g pnpm && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
        corepack enable && yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
        npm ci --omit=dev; \
    else \
        npm i --omit=dev; \
    fi

# ---- build (optional for TS) ----
# Copy the full backend source
COPY . .

# If a tsconfig.json exists, we assume TypeScript and run a build.
# This no-ops for JS projects.
RUN if [ -f tsconfig.json ]; then \
        echo "Detected tsconfig.json: running build"; \
        if command -v pnpm >/dev/null 2>&1 && [ -f pnpm-lock.yaml ]; then pnpm run build; \
        elif [ -f yarn.lock ]; then yarn build; \
        else npm run build; fi; \
    else \
        echo "No tsconfig.json found: assuming JS project"; \
    fi

# Expose the port your server listens on (adjust if needed)
ENV PORT=8080
EXPOSE 8080

# Start command:
# - If TS build happened and produced dist/index.js -> run that.
# - Else fall back to node index.js
CMD sh -c 'if [ -f "dist/index.js" ]; then node dist/index.js; elif [ -f "build/index.js" ]; then node build/index.js; else node index.js; fi'
