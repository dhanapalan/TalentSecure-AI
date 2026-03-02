import { Router } from "express";
import { proctoringController } from "../controllers/proctoring.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Student endpoint (event logging)
router.post("/events", authorize("student"), proctoringController.logEvent);

// Admin endpoints (monitoring)
router.get(
  "/live",
  authorize("super_admin", "admin", "hr", "engineer", "cxo", "college_admin", "college"),
  proctoringController.getLiveMonitoring,
);
router.get(
  "/session/:sessionId/timeline",
  authorize("super_admin", "admin", "hr", "engineer", "cxo", "college_admin", "college"),
  proctoringController.getSessionTimeline,
);
router.post(
  "/session/:sessionId/clear",
  authorize("super_admin", "admin", "hr", "college_admin", "college"),
  proctoringController.clearIncident,
);
router.post(
  "/session/:sessionId/terminate",
  authorize("super_admin", "admin", "hr", "college_admin", "college"),
  proctoringController.terminateSession,
);

export const proctoringRoutes = router;
