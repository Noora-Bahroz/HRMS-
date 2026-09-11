import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "./http";

type Path = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Path = "body"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        next(ApiError.unprocessable("Validation failed", details));
      } else {
        next(err);
      }
    }
  };
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
