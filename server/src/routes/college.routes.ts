import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../middleware/auth.js";
import * as collegeController from "../controllers/college.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (isCsv) {
      return cb(null, true);
    }
    cb(new Error("Only CSV files are allowed for students_file"));
  },
});

/**
 * POST /api/colleges/add-students
 * Auth: JWT + role (college_staff or legacy college role)
 * Input:
 * - JSON: { students: [{ student_id, phone_number, name?, email? }, ...] }
 * - CSV : multipart/form-data with "students_file"
 */
router.post(
  "/add-students",
  authenticate,
  authorize("college_staff", "college_admin", "college"),
  upload.single("students_file"),
  collegeController.addStudents,
);

router.get(
  "/students",
  authenticate,
  authorize("college_staff", "college_admin", "college"),
  collegeController.getStudents,
);

router.get(
  "/exams",
  authenticate,
  authorize("college_staff", "college_admin", "college"),
  collegeController.getAssignedExams,
);

router.get(
  "/stats",
  authenticate,
  authorize("college_staff", "college_admin", "college"),
  collegeController.getCollegeStats,
);

export default router;
