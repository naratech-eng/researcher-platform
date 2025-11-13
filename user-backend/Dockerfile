# Bun official image (2025-05)
FROM oven/bun:1.1.3

WORKDIR /app

# Install curl and download the RDS global trust bundle for TLS to DocumentDB
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSL -o /etc/ssl/certs/rds-global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

COPY package.json ./
RUN bun install --production

COPY . .

EXPOSE 3000
ENV PORT=3000
CMD ["bun", "run", "src/server.ts"]
