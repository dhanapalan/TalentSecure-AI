import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as campusDrivesController from "../controllers/campus.drives.controller.js";

const router = Router();

// Secure all routes in this file
router.use(authenticate);
router.use(authorize("college_admin", "college", "college_staff"));

router.get("/", campusDrivesController.listCampusDrives);
router.get("/:id", campusDrivesController.getDriveSummary);
router.get("/:id/students", campusDrivesController.getDriveStudents);
router.get("/:id/attendance", campusDrivesController.getDriveAttendance);
router.get("/:id/results", campusDrivesController.getDriveResults);
router.get("/:id/integrity", campusDrivesController.getDriveIntegrity);
router.put("/:id/placement", campusDrivesController.updatePlacementStatus);

export default router;
