import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import * as authService from "../services/auth.service.js";
import { ApiResponse } from "../types/index.js";
import { env } from "../config/env.js";

// ── OAuth CSRF state helpers ──────────────────────────────────────────────────
// State = base64(nonce + "." + timestamp) signed with HMAC-SHA256.
// Valid for 10 minutes; no server-side storage needed.

function generateOAuthState(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const ts = Date.now().toString();
  const payload = `${nonce}.${ts}`;
  const sig = crypto.createHmac("sha256", env.JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

function verifyOAuthState(state: string): boolean {
  try {
    const decoded = Buffer.from(state, "base64url").toString();
    const parts = decoded.split(".");
    if (parts.length !== 3) return false;
    const [nonce, ts, sig] = parts;
    const payload = `${nonce}.${ts}`;
    const expected = crypto.createHmac("sha256", env.JWT_SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false;
    // Expire after 10 minutes
    if (Date.now() - parseInt(ts) > 10 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

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
    const state = generateOAuthState();
    const url = await authService.getMicrosoftAuthUrl(state);
    res.json({ success: true, data: { url, state } });
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
    const { code, state } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: "Authorization code is required" });
      return;
    }
    if (!state || !verifyOAuthState(state)) {
      res.status(400).json({ success: false, message: "Invalid or expired OAuth state. Please try signing in again." });
      return;
    }
    const result = await authService.loginWithMicrosoft(code, req.ip);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
