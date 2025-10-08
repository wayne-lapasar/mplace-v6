FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --ci

COPY . .

CMD ["bun", "run", "apps/api/src/main.ts"]
