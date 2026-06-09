import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { AppError } from "../../../middleware/errorHandler.js";
import { logger } from "../../../config/logger.js";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.isOperational ? exception.message : "Internal server error";
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === "string" ? body : (body as any).message ?? exception.message;
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    logger.error(`[${status}] ${err.message}`, { stack: err.stack, status });

    res.status(status).json({ success: false, error: message });
  }
}
