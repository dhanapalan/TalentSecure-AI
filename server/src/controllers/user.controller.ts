import { Request, Response, NextFunction } from "express";
import { query, queryOne } from "../config/database.js";
import { ApiResponse, UserRow } from "../types/index.js";
import { AppError } from "../middleware/errorHandler.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { writeAuditLog } from "../services/audit.service.js";

/**
 * List all system users with optional role filtering
 */
export const listUsers = async (
    req: Request,
    res: Response<ApiResponse<UserRow[]>>,
    next: NextFunction
) => {
    try {
        const { role, search } = req.query;
        let sql = `
            SELECT 
                u.id, u.role, u.first_name, u.last_name, u.email, 
                u.is_active, u.created_at, u.updated_at,
                c.name as college_name
            FROM users u
            LEFT JOIN campuses c ON c.id = u.college_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (role) {
            params.push(role);
            sql += ` AND u.role = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
        }

        sql += ` ORDER BY u.created_at DESC LIMIT 200`;

        const users = await query<UserRow>(sql, params);
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

/**
 * Update a user's system role
 */
export const updateUserRole = async (
    req: Request,
    res: Response<ApiResponse<UserRow>>,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            throw new AppError("Role is required", 400);
        }

        const validRoles = [
            "super_admin", "admin", "hr", "engineer", "cxo",
            "college_admin", "college_staff", "student"
        ];
        if (!validRoles.includes(role)) {
            throw new AppError("Invalid role specified", 400);
        }

        const updatedUser = await queryOne<UserRow>(
            `UPDATE users 
             SET role = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING id, role, email, first_name, last_name, is_active`,
            [role, id]
        );

        if (!updatedUser) {
            throw new AppError("User not found", 404);
        }

        res.json({
            success: true,
            data: updatedUser,
            message: `User role updated to ${role}`
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Delete a user
 */
export const deleteUser = async (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        // Don't allow deleting self? (Optional, usually handled in middleware or client)

        await query("DELETE FROM users WHERE id = $1", [id]);
        res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        next(err);
    }
};

/**
 * Create a new system user
 */
export const createUser = async (
    req: Request,
    res: Response<ApiResponse<UserRow>>,
    next: NextFunction
) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        if (!firstName || !lastName || !email || !password || !role) {
            throw new AppError("All fields are required", 400);
        }

        const existing = await queryOne<UserRow>(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );
        if (existing) {
            throw new AppError("Email already in use", 409);
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await queryOne<UserRow>(
            `INSERT INTO users (first_name, last_name, email, password, role, is_active)
             VALUES ($1, $2, $3, $4, $5::user_role, TRUE)
             RETURNING id, first_name, last_name, email, role, is_active, created_at`,
            [firstName, lastName, email, hashedPassword, role]
        );

        if (!user) {
            throw new AppError("Failed to create user record", 500);
        }

        // Audit Logging
        await writeAuditLog({
            actor_id: (req as any).user?.userId || "system",
            actor_role: (req as any).user?.role || "unknown",
            action: "USER_CREATED",
            target_type: "user",
            target_id: user.id,
            reason: `Manual creation by admin (${user.role})`,
            metadata: { email: user.email }
        }).catch(err => console.error("Audit log failed", err));

        res.status(201).json({
            success: true,
            data: user,
            message: "User created successfully"
        });
    } catch (err) {
        console.error("DEBUG: createUser error details:", err);
        next(err);
    }
};
