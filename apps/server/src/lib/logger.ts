import winston from "winston";
import { config } from "../config";

export const logger = winston.createLogger({
  level: config.env === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.env === "production"
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, stack }) => {
          const msg = typeof message === "string" ? message : JSON.stringify(message);
          return `${timestamp} [${level}]: ${msg}${stack ? `\n${stack}` : ""}`;
        })
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
