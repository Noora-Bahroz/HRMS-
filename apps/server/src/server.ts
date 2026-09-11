import "reflect-metadata";
import app from "./app";
import { config } from "./config";
import { prisma } from "./lib/prisma";
import logger from "./lib/logger";

async function start() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    const server = app.listen(config.port, () => {
      logger.info(`HRMS API listening on http://localhost:${config.port}/api/v1`);
      logger.info(`Swagger docs: http://localhost:${config.port}/api/v1/docs`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (err) {
    logger.error("Failed to start server", { err });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { start };
