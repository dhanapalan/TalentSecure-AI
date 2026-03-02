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

/**
 * GET /api/auth/microsoft
 * Return URL to redirect user for MS Login
 */
export const microsoftLoginUrl = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    // optional state could be generated here to prevent CSRF
    const url = await authService.getMicrosoftAuthUrl("talentsecure-sso");
    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/microsoft
 * Exchange code for JWT
 */
export const microsoftLogin = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: "Authorization code is required" });
      return;
    }
    const result = await authService.loginWithMicrosoft(code, req.ip);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
