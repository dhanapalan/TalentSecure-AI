import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { queryOne } from "../config/database.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { UserRow, AuthPayload, UserRole } from "../types/index.js";
import { logLogin, logLoginFailure } from "./audit.service.js";

/**
 * Authenticate a user by email + password and return a JWT.
 */
export async function loginUser(email: string, password: string, ip?: string) {
  const user = await queryOne<UserRow>(
    "SELECT * FROM users WHERE email = $1 AND is_active = TRUE",
    [email],
  );

  if (!user) {
    logLoginFailure(email, ip, "User not found or inactive").catch(() => {});
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    logLoginFailure(email, ip, "Invalid password").catch(() => {});
    throw new AppError("Invalid email or password", 401);
  }

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role.toLowerCase() as UserRole,
    college_id: user.college_id ?? null,
  };

  // jwt.sign expiresIn accepts ms-format strings at runtime ("7d", "1h", etc.)
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  // Audit: successful login
  logLogin(user.id, user.email, user.role, ip).catch(() => {});

  return {
    accessToken,
    user: {
      id: user.id,
      role: user.role,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      college_id: user.college_id ?? null,
      department: user.department ?? null,
      phone_number: user.phone_number ?? null,
      is_profile_complete: user.is_profile_complete ?? false,
    },
  };
}

/**
 * Return the authenticated user's profile from the database.
 */
export async function getMe(userId: string) {
  const user = await queryOne<UserRow>(
    `SELECT id,
            role,
            first_name,
            last_name,
            email,
            college_id,
            phone_number,
            dob,
            is_profile_complete,
            is_active,
            created_at
     FROM users
     WHERE id = $1`,
    [userId],
  );
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return {
    id: user.id,
    role: user.role,
    name: `${user.first_name} ${user.last_name}`.trim(),
    email: user.email,
    college_id: user.college_id ?? null,
    phone_number: user.phone_number ?? null,
    dob: user.dob ?? null,
    is_profile_complete: user.is_profile_complete ?? false,
    is_active: user.is_active,
    created_at: user.created_at,
  };
}
