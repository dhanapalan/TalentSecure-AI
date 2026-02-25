import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { queryOne } from "../config/database.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { UserRow, AuthPayload, UserRole } from "../types/index.js";
import { logLogin, logLoginFailure } from "./audit.service.js";

function resolveDisplayName(user: UserRow): string {
  if (typeof user.name === "string" && user.name.trim().length > 0) {
    return user.name.trim();
  }
  const composed = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return composed || user.email;
}

/**
 * Authenticate a user by email + password and return a JWT.
 */
export async function loginUser(email: string, password: string, ip?: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await queryOne<UserRow>(
    "SELECT * FROM users WHERE email = $1 AND is_active = TRUE",
    [normalizedEmail],
  );

  if (!user) {
    logLoginFailure(email, ip, "User not found or inactive").catch(() => { });
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    logLoginFailure(email, ip, "Invalid password").catch(() => { });
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
  logLogin(user.id, user.email, user.role, ip).catch(() => { });

  return {
    accessToken,
    user: {
      id: user.id,
      role: user.role,
      name: resolveDisplayName(user),
      email: user.email,
      college_id: user.college_id ?? null,
      department: user.department ?? null,
      phone_number: user.phone_number ?? null,
      is_profile_complete: user.is_profile_complete ?? false,
      must_change_password: user.must_change_password ?? false,
    },
  };
}

/**
 * Return the authenticated user's profile from the database.
 */
export async function getMe(userId: string) {
  const user = await queryOne<
    UserRow & {
      college_name?: string | null;
      student_identifier?: string | null;
      degree?: string | null;
      specialization?: string | null;
      class_name?: string | null;
      section?: string | null;
      passing_year?: number | null;
      cgpa?: number | null;
      percentage?: number | null;
      resume_url?: string | null;
      skills?: string[] | null;
      linkedin_url?: string | null;
      github_url?: string | null;
      profile_photo_url?: string | null;
    }
  >(
    `SELECT
        u.*,
        c.name AS college_name,
        sd.student_identifier,
        sd.degree,
        sd.specialization,
        sd.class_name,
        sd.section,
        sd.passing_year,
        sd.cgpa,
        sd.percentage,
        sd.resume_url,
        sd.skills,
        sd.linkedin_url,
        sd.github_url,
        sd.face_photo_url AS profile_photo_url
     FROM users u
     LEFT JOIN student_details sd ON sd.user_id = u.id
     LEFT JOIN colleges c ON c.id = COALESCE(u.college_id, sd.college_id)
     WHERE u.id = $1`,
    [userId],
  );
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return {
    id: user.id,
    role: user.role,
    name: resolveDisplayName(user),
    email: user.email,
    college_id: user.college_id ?? null,
    phone_number: user.phone_number ?? null,
    dob: user.dob ?? null,
    is_profile_complete: user.is_profile_complete ?? false,
    college_name: user.college_name ?? null,
    student_identifier: user.student_identifier ?? null,
    degree: user.degree ?? null,
    specialization: user.specialization ?? null,
    class_name: user.class_name ?? null,
    section: user.section ?? null,
    passing_year: user.passing_year ?? null,
    cgpa: user.cgpa ?? null,
    percentage: user.percentage ?? null,
    resume_url: user.resume_url ?? null,
    skills: user.skills ?? [],
    linkedin_url: user.linkedin_url ?? null,
    github_url: user.github_url ?? null,
    profile_photo_url: user.profile_photo_url ?? null,
    is_active: user.is_active,
    created_at: user.created_at,
  };
}

/**
 * Update a user's password and clear the must_change_password flag.
 */
export async function updatePassword(userId: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await queryOne(
    `UPDATE users 
     SET password = $1, must_change_password = FALSE, updated_at = NOW()
     WHERE id = $2
     RETURNING id`,
    [hashedPassword, userId]
  );

  if (!result) {
    throw new AppError("User not found", 404);
  }
}
