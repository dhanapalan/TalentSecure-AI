import { Request, Response } from "express";
import { ApiResponse } from "../types/index.js";

export const notFoundHandler = (_req: Request, res: Response<ApiResponse>): void => {
  res.status(404).json({
    success: false,
    error: "Resource not found",
  });
};
