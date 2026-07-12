import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as campusStudentsController from "../controllers/campus.students.controller.js";

const router = Router();

router.use(authenticate);
router.use(authorize("college_admin", "college", "college_staff"));

router.get("/analytics", campusStudentsController.getAnalytics);

router.get("/", campusStudentsController.listStudents);
router.post("/", campusStudentsController.createStudent);
router.post("/bulk-import", campusStudentsController.bulkImport);
router.post("/bulk-action", campusStudentsController.bulkAction);
router.get("/:id", campusStudentsController.getStudentProfile);
router.put("/:id", campusStudentsController.updateStudent);
router.delete("/:id", campusStudentsController.softDeleteStudent);

export default router;
