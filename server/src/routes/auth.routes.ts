import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * GET /api/auth/me — returns the authenticated user's profile
 */
router.get("/me", authenticate, authController.me);

export default router;
