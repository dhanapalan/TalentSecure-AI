import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";
import { ApiResponse } from "../types/index.js";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError && err.isOperational
      ? err.message
      : "Internal server error";

  logger.error(`[${statusCode}] ${err.message}`, {
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
