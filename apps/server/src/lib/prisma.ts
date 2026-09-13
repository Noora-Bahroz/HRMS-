import { PrismaClient } from "@prisma/client";
import { isTest } from "../config";
import { config } from "../config";

// Global Prisma client reused across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isTest ? [] : ["warn", "error"],
    datasources: {
      db: { url: config.databaseUrl },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
