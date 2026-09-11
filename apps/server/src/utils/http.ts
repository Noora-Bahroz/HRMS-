import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function ok<T>(res: Response, data: T, meta?: PaginationMeta, status = 200) {
  const body: Record<string, unknown> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function created<T>(res: Response, data: T, meta?: PaginationMeta) {
  return ok(res, data, meta, 201);
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown[];

  constructor(status: number, code: string, message: string, details?: unknown[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown[]) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message: string) {
    return new ApiError(409, "CONFLICT", message);
  }
  static internal(message = "Internal server error") {
    return new ApiError(500, "INTERNAL_SERVER_ERROR", message);
  }
  static unprocessable(message: string, details?: unknown[]) {
    return new ApiError(422, "UNPROCESSABLE_ENTITY", message, details);
  }
}

export function paginate(page: number, limit: number, total: number): PaginationMeta {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
}

export function getPagination(query: Record<string, unknown>) {
  const page = typeof query.page === "string" ? parseInt(query.page, 10) : 1;
  const limit = typeof query.limit === "string" ? parseInt(query.limit, 10) : 20;
  return { page: Number.isFinite(page) ? page : 1, limit: Number.isFinite(limit) ? limit : 20 };
}
