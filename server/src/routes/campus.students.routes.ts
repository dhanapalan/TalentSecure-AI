import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as campusStudentsController from "../controllers/campus.students.controller.js";

const router = Router();

// Secure all routes in this file
router.use(authenticate);
router.use(authorize("college_admin", "college", "college_staff"));

router.get("/analytics", campusStudentsController.getAnalytics);

router.get("/", campusStudentsController.listStudents);
router.get("/:id", campusStudentsController.getStudentProfile);
router.post("/", campusStudentsController.createStudent);
router.put("/:id", campusStudentsController.updateStudent);

// Bulk operations
router.post("/bulk-import", campusStudentsController.bulkImport);
router.post("/bulk-action", campusStudentsController.bulkAction);

export default router;
