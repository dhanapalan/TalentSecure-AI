/**
 * Bridge utility — lets NestJS controllers call existing Express-style
 * (req, res, next) handler functions without rewriting them.
 *
 * Returns a Promise that resolves with the response body the handler would
 * have sent via res.json() / res.status().json().
 * Throws HttpException-compatible errors so NestJS exception filters work.
 */

import { HttpException } from "@nestjs/common";
import { AppError } from "../../middleware/errorHandler.js";
import { Request, Response } from "express";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressHandler = (req: any, res: any, next: (err?: unknown) => void) => any;

export class ExpressAdapter {
  static invoke(
    handler: ExpressHandler,
    reqOverrides: Partial<Request> = {},
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let statusCode = 200;
      let responseBody: unknown;

      const req = reqOverrides as unknown as Request;

      const res = {
        statusCode,
        status(code: number) { statusCode = code; return this; },
        json(body: unknown) { responseBody = body; resolve(body); return this; },
        send(body: unknown) { responseBody = body; resolve(body); return this; },
      } as unknown as Response;

      const next = (err?: unknown) => {
        if (!err) { resolve(responseBody); return; }
        if (err instanceof AppError) {
          reject(new HttpException({ success: false, error: err.message }, err.statusCode));
        } else if (err instanceof Error) {
          reject(new HttpException({ success: false, error: err.message }, 500));
        } else {
          reject(err);
        }
      };

      Promise.resolve(handler(req, res, next)).catch(next);
    });
  }
}
