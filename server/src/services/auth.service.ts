import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { queryOne } from "../config/database.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { UserRow, AuthPayload, UserRole } from "../types/index.js";
import { logLogin, logLoginFailure } from "./audit.service.js";
import { ConfidentialClientApplication, Configuration, LogLevel } from "@azure/msal-node";

// MSAL Configuration
let _msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (!_msalClient) {
    if (!env.MSAL_CLIENT_ID || !env.MSAL_CLIENT_SECRET || !env.MSAL_TENANT_ID) {
      throw new AppError("Microsoft SSO environment variables are not properly configured", 500);
    }

    const msalConfig: Configuration = {
      auth: {
        clientId: env.MSAL_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${env.MSAL_TENANT_ID}`,
        clientSecret: env.MSAL_CLIENT_SECRET,
      },
      system: {
        loggerOptions: {
          loggerCallback(loglevel, message) {
            if (loglevel === LogLevel.Error) {
              console.error(`MSAL ERROR: ${message}`);
            }
          },
          piiLoggingEnabled: false,
          logLevel: LogLevel.Error,
        },
      },
    };
    _msalClient = new ConfidentialClientApplication(msalConfig);
  }
  return _msalClient;
}

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
  const user = await queryOne<UserRow & { college_name?: string | null }>(
    `SELECT u.*, c.name as college_name 
     FROM users u
     LEFT JOIN colleges c ON c.id = u.college_id
     WHERE u.email = $1 AND u.is_active = TRUE`,
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
      college_name: user.college_name ?? null,
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

/**
 * Generate Microsoft OAuth2 Login URL
 */
export async function getMicrosoftAuthUrl(state: string) {
  const authCodeUrlParameters = {
    scopes: ["user.read"],
    redirectUri: env.MSAL_REDIRECT_URI,
    state,
  };
  return await getMsalClient().getAuthCodeUrl(authCodeUrlParameters);
}

/**
 * Handle MSAL Callback & Login User
 */
export async function loginWithMicrosoft(code: string, ip?: string) {
  const tokenRequest = {
    code,
    scopes: ["user.read"],
    redirectUri: env.MSAL_REDIRECT_URI,
  };

  try {
    const response = await getMsalClient().acquireTokenByCode(tokenRequest);
    const account = response.account;

    if (!account) {
      throw new AppError("Failed to retrieve Microsoft account", 401);
    }

    const email = account.username.toLowerCase();

    // Check if user exists in our DB
    const user = await queryOne<UserRow>(
      "SELECT * FROM users WHERE email = $1 AND is_active = TRUE",
      [email]
    );

    if (!user) {
      logLoginFailure(email, ip, "Microsoft SSO - User not found").catch(() => { });
      throw new AppError("User not found or inactive. Please contact an administrator.", 401);
    }

    // Update login_type and last_login_at
    await queryOne("UPDATE users SET last_login_at = NOW(), login_type = 'Microsoft_SSO' WHERE id = $1", [user.id]);

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.toLowerCase() as UserRole,
      college_id: user.college_id ?? null,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

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
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error("MSAL Token Error:", err);
    throw new AppError("Microsoft Login failed", 401);
  }
}
