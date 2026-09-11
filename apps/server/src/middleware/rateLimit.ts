import rateLimit from "express-rate-limit";
import { isTest } from "../config";

// In-memory fallback when Redis is not connected. In production this should
// be backed by a distributed store. Rate limiting is disabled in tests.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: isTest ? 0 : 20, // 20 login attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMIT", message: "Too many attempts, please try again later" },
  },
  skip: () => isTest,
});

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 0 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMIT", message: "Too many requests" },
  },
  skip: () => isTest,
});
