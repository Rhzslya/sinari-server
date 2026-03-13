# server/Dockerfile
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    chromium \
    libglib2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json dulu biar caching jalan (Optimasi DevOps)
COPY package.json bun.lock ./
RUN bun install

# Copy sisa kodingan
COPY . .

# Generate Client Prisma
RUN bunx prisma generate

# Expose port (hanya dokumentasi)
EXPOSE 3000

# Jalankan server
CMD ["bun", "run", "dev"]