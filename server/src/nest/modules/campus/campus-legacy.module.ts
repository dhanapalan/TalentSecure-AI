/**
 * CAMPUS legacy module — mounts existing Express routers unchanged.
 * Covers: /api/campus, /api/colleges, /api/college-dashboard,
 *         /api/campus-students, /api/campus-drives, /api/college-skills
 * TODO: Port each to a full NestJS controller in a follow-up.
 */
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import campusRoutes from "../../../routes/campus.routes.js";
import collegeRoutes from "../../../routes/college.routes.js";
import collegeDashboardRoutes from "../../../routes/college.dashboard.routes.js";
import campusStudentRoutes from "../../../routes/campus.students.routes.js";
import campusDrivesRoutes from "../../../routes/campus.drives.routes.js";
import collegeSkillsRoutes from "../../../routes/collegeSkills.routes.js";
import { applyLegacyRouter } from "../../utils/legacy-router.middleware.js";

@Module({})
export class CampusLegacyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    applyLegacyRouter(consumer, campusRoutes, "/api/campus");
    applyLegacyRouter(consumer, collegeRoutes, "/api/colleges");
    applyLegacyRouter(consumer, collegeDashboardRoutes, "/api/college-dashboard");
    applyLegacyRouter(consumer, campusStudentRoutes, "/api/campus-students");
    applyLegacyRouter(consumer, campusDrivesRoutes, "/api/campus-drives");
    applyLegacyRouter(consumer, collegeSkillsRoutes, "/api/college-skills");
  }
}
