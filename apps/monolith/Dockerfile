# * Dockerfile for monolith deployment

FROM oven/bun:1 AS base
WORKDIR /app

# * Install dependencies
FROM base AS install
COPY package.json bun.lockb ./
COPY apps/monolith/package.json ./apps/monolith/
COPY packages/*/package.json ./packages/
RUN bun install --frozen-lockfile

# * Build application
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun run build

# * Production image
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# * Run as non-root user
USER bun
EXPOSE 3000

ENTRYPOINT ["bun", "run", "start"]
