import dotenv from "@dotenvx/dotenvx";
import type { PrismaConfig } from "prisma";

dotenv.config();

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
} satisfies PrismaConfig;
