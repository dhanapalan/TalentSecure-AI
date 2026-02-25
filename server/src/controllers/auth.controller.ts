import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { ApiResponse } from "../types/index.js";

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password, req.ip);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the current user from the JWT.
 */
export const me = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const setupPassword = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { password } = req.body;
    const userId = req.user!.userId;

    await authService.updatePassword(userId, password);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};
