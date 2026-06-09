/**
 * SHARED legacy module — mounts remaining Express routers unchanged.
 * Covers: /api/analytics, /api/admin, /api/audit-logs, /api/notifications,
 *         /api/gamification, /api/mentor, /api/mock-interviews,
 *         /api/development, /api/skills, /api/roles, /api/cheating
 * TODO: Port each to a full NestJS controller in a follow-up.
 */
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import analyticsRoutes from "../../../routes/analytics.routes.js";
import adminRoutes from "../../../routes/admin.routes.js";
import auditLogRoutes from "../../../routes/auditLog.routes.js";
import notificationRoutes from "../../../routes/notification.routes.js";
import gamificationRoutes from "../../../routes/gamification.routes.js";
import mentorRoutes from "../../../routes/mentor.routes.js";
import mockInterviewRoutes from "../../../routes/mockInterview.routes.js";
import developmentRoutes from "../../../routes/development.routes.js";
import skillsRoutes from "../../../routes/skills.routes.js";
import roleRoutes from "../../../routes/role.routes.js";
import cheatingRoutes from "../../../routes/cheating.routes.js";
import { applyLegacyRouter } from "../../utils/legacy-router.middleware.js";

@Module({})
export class SharedLegacyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    applyLegacyRouter(consumer, analyticsRoutes, "/api/analytics");
    applyLegacyRouter(consumer, adminRoutes, "/api/admin");
    applyLegacyRouter(consumer, auditLogRoutes, "/api/audit-logs");
    applyLegacyRouter(consumer, notificationRoutes, "/api/notifications");
    applyLegacyRouter(consumer, gamificationRoutes, "/api/gamification");
    applyLegacyRouter(consumer, mentorRoutes, "/api/mentors");
    applyLegacyRouter(consumer, mockInterviewRoutes, "/api/mock-interviews");
    applyLegacyRouter(consumer, developmentRoutes, "/api/development");
    applyLegacyRouter(consumer, skillsRoutes, "/api/skills");
    applyLegacyRouter(consumer, roleRoutes, "/api/roles");
    applyLegacyRouter(consumer, cheatingRoutes, "/api/cheating");
  }
}
