import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiResponse } from "../types/index.js";

/**
 * Express middleware to validate request body, query, or params against a Zod schema.
 */
export const validate = (
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        res.status(400).json({
          success: false,
          error: "Validation failed",
          message: messages.join("; "),
        });
        return;
      }
      next(err);
    }
  };
};
