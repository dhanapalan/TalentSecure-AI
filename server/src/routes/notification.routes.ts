import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get user notifications
router.get("/", notificationController.getUserNotifications);

// Mark all as read
router.put("/read-all", notificationController.markAllAsRead);

// Mark specific notification as read
router.put("/:id/read", notificationController.markAsRead);

export default router;
