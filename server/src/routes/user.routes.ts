import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

/**
 * All user management routes require Admin (super_admin) privileges only.
 * HR, Engineer, and CxO cannot manage users per RBAC policy.
 */
router.use(authenticate);
router.use(authorize("super_admin", "admin"));

router.get("/", userController.listUsers);
router.post("/", userController.createUser);
router.put("/:id/role", userController.updateUserRole);
router.delete("/:id", userController.deleteUser);

export default router;
