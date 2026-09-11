import dotenv from "dotenv";
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  },
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    accessKey: process.env.MINIO_ACCESS_KEY || "hrms",
    secretKey: process.env.MINIO_SECRET_KEY || "hrmsminio",
    bucket: process.env.MINIO_BUCKET || "hrms-files",
    useSSL: process.env.MINIO_USE_SSL === "true",
  },
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://hrms:hrms@localhost:5672",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};

export const isProd = config.env === "production";
export const isTest = config.env === "test";
