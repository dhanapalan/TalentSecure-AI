import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import * as workflowsController from "../controllers/workflows.controller.js";

const router = Router();

// All routes require super_admin role
router.use(authenticate);
router.use(authorize("super_admin"));

// List workflows
router.get("/", workflowsController.listWorkflows);

// Get workflow details
router.get("/:id", workflowsController.getWorkflow);

// Create workflow
router.post("/", workflowsController.createWorkflow);

// Update workflow
router.put("/:id", workflowsController.updateWorkflow);

// Delete workflow
router.delete("/:id", workflowsController.deleteWorkflow);

// Update workflow steps
router.put("/:id/steps", workflowsController.updateWorkflowSteps);

export default router;
