import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/http";
import logger from "../lib/logger";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Internal server error";
  let details: unknown[] | undefined;

  if (err instanceof ApiError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      status = 409;
      code = "CONFLICT";
      message = `Duplicate value on: ${(err.meta?.target as string) ?? "field"}`;
    } else if (err.code === "P2025") {
      status = 404;
      code = "NOT_FOUND";
      message = "Record not found";
    } else {
      status = 400;
      code = "DATABASE_ERROR";
      message = "Database operation failed";
    }
  } else if (err instanceof SyntaxError) {
    status = 400;
    code = "BAD_REQUEST";
    message = "Malformed request body";
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${message}`, { err });
  }

  res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}
