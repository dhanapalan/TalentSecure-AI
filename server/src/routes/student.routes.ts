import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import * as studentController from "../controllers/student.controller.js";

const router = Router();

// ── Multer: store file in memory buffer for direct S3 upload ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ── Validation Schemas ───────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  college_id: z.string().uuid("college_id must be a valid UUID"),
});

const onboardingSchema = z.object({
  university: z.string().min(2, "University is required"),
  degree: z.string().min(2, "Degree is required"),
  major: z.string().min(2, "Major is required"),
  graduation_year: z.number().int().min(2000).max(2100),
  cgpa: z.number().min(0).max(10),
});

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/students/register
 * Public endpoint — registers a new student.
 * Accepts multipart form with an optional webcam_photo file field.
 */
router.post(
  "/register",
  upload.single("webcam_photo"),
  validate(registerSchema),
  studentController.register,
);

/**
 * PUT /api/students/me/onboarding
 * Student profile completion on first login.
 * Requires JWT and student role.
 */
router.put(
  "/me/onboarding",
  authenticate,
  authorize("student"),
  validate(onboardingSchema),
  studentController.completeOnboarding,
);

/**
 * GET /api/students
 * List all students (Admin/HR/CxO read-only)
 */
router.get(
  "/",
  authenticate,
  authorize("super_admin", "admin", "hr", "cxo"),
  studentController.list
);

/**
 * PUT /api/students/:id
 * Update student / profile (HR/Admin)
 */
router.put(
  "/:id",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  studentController.update
);

/**
 * DELETE /api/students/:id
 * Delete student (HR/Admin)
 */
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin", "admin", "hr"),
  studentController.deleteStudent
);

/**
 * GET /api/students/:studentId/exams
 * Returns exam schedule for the given student.
 * Requires JWT authentication — Admin, HR, student, CxO.
 */
router.get(
  "/:studentId/exams",
  authenticate,
  authorize("super_admin", "admin", "hr", "cxo", "student"),
  studentController.getExamSchedule,
);

export default router;
