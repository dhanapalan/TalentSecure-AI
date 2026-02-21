import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { query, queryOne } from "../config/database.js";
import { v4 as uuidv4 } from "uuid";
import { writeAuditLog } from "../services/audit.service.js";

const router = Router();

const createRoleSchema = z.object({
    title: z.string().min(1, "Title is required"),
    company: z.string().min(1, "Company is required"),
    description: z.string().min(1, "Description is required"),
    technicalSkills: z.array(z.any()).optional(),
    behavioralCompetencies: z.array(z.any()).optional(),
    minCGPA: z.number().min(0).max(10),
    eligibleDegrees: z.array(z.string()),
    eligibleMajors: z.array(z.string()),
    maxPositions: z.number().int().positive(),
});

/**
 * GET /api/roles
 * List all job roles (Admin, HR, CxO can read)
 */
router.get("/", authenticate, authorize("super_admin", "admin", "hr", "cxo"), async (req, res, next) => {
    try {
        const roles = await query("SELECT * FROM roles ORDER BY created_at DESC");
        res.json({ success: true, data: roles });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/roles
 * Create a new job role
 */
router.post(
    "/",
    authenticate,
    authorize("super_admin", "admin", "hr"),
    validate(createRoleSchema),
    async (req, res, next) => {
        try {
            const {
                title, company, description, technicalSkills,
                behavioralCompetencies, minCGPA, eligibleDegrees,
                eligibleMajors, maxPositions
            } = req.body;

            const id = uuidv4();

            const role = await queryOne(
                `INSERT INTO roles (
                    id, title, company, description, technical_skills, 
                    behavioral_competencies, min_cgpa, eligible_degrees, 
                    eligible_majors, max_positions, status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE', NOW(), NOW())
                RETURNING *`,
                [
                    id, title, company, description,
                    JSON.stringify(technicalSkills || []),
                    JSON.stringify(behavioralCompetencies || []),
                    minCGPA, eligibleDegrees, eligibleMajors, maxPositions
                ]
            );

            res.status(201).json({ success: true, data: role });

            // Audit log
            writeAuditLog({
                actor_id: req.user!.userId,
                actor_role: req.user!.role,
                action: "ROLE_CREATED",
                target_type: "role",
                target_id: id,
                reason: `Created job role: ${title} at ${company}`,
                ip_address: req.ip,
            }).catch(() => {});
        } catch (err) {
            next(err);
        }
    }
);

export default router;
