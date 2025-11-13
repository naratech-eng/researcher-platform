# Bun official image (2025-05)
FROM oven/bun:1.1.3

WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY . .

EXPOSE 3000
ENV PORT=3000
CMD ["bun", "run", "src/server.ts"]
