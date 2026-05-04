import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  console.error(err);
  return res.status(500).json({
    error: "Internal server error",
    code: "internal_error",
  });
}
