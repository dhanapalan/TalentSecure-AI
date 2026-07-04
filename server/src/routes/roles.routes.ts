import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as rolesController from "../controllers/roles.controller.js";

const router = Router();

/**
 * List all roles with usage stats
 * GET /api/superadmin/roles
 */
router.get(
  "/",
  authenticate,
  authorize("super_admin"),
  rolesController.listRoles
);

/**
 * Get all permissions
 * GET /api/superadmin/roles/permissions
 */
router.get(
  "/permissions",
  authenticate,
  authorize("super_admin"),
  rolesController.getPermissions
);

/**
 * Get single role with permissions
 * GET /api/superadmin/roles/:id
 */
router.get(
  "/:id",
  authenticate,
  authorize("super_admin"),
  rolesController.getRole
);

/**
 * Create new role
 * POST /api/superadmin/roles
 */
router.post(
  "/",
  authenticate,
  authorize("super_admin"),
  rolesController.createRole
);

/**
 * Update role details
 * PUT /api/superadmin/roles/:id
 */
router.put(
  "/:id",
  authenticate,
  authorize("super_admin"),
  rolesController.updateRole
);

/**
 * Delete role
 * DELETE /api/superadmin/roles/:id
 */
router.delete(
  "/:id",
  authenticate,
  authorize("super_admin"),
  rolesController.deleteRole
);

/**
 * Update role permissions
 * PUT /api/superadmin/roles/:id/permissions
 */
router.put(
  "/:id/permissions",
  authenticate,
  authorize("super_admin"),
  rolesController.updateRolePermissions
);

export default router;
