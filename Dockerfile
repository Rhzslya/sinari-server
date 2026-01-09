# server/Dockerfile
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

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